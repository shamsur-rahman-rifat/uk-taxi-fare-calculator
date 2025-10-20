// src/controller/fareController.js
import axios from 'axios';

// Convert meters → miles
const metersToMiles = (m) => m / 1609.34;

// Utility: Get location details from Google Geocoding API
const getLocationDetails = async (address) => {
  const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
    params: {
      address,
      key: process.env.GOOGLE_MAPS_API_KEY,
    },
  });

  if (!response.data.results.length) return null;
  
  // Optimize: Extract only what we need and normalize once
  const components = new Set(
    response.data.results[0].address_components
      .map(c => c.long_name.toLowerCase())
  );
  return components;
};

export const calculateFare = async (req, res) => {
  const { start, destination } = req.body;

  if (!start || !destination) {
    return res.status(400).json({ error: 'Start and destination are required' });
  }

  try {
    // Fix: Use UK timezone (Europe/London) for accurate time
    const now = new Date();
    const ukTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
    const hour = ukTime.getHours();
    const isDaytime = hour >= 6 && hour < 22;

    // Optimization 2: Parallel API calls instead of sequential
    const [distanceResponse, startComponents, destComponents] = await Promise.all([
      axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
        params: {
          origins: start,
          destinations: destination,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      }),
      getLocationDetails(start),
      getLocationDetails(destination),
    ]);

    // Validation checks
    if (!startComponents || !destComponents) {
      return res.status(400).json({ error: 'Could not validate address regions.' });
    }

    const element = distanceResponse.data.rows[0].elements[0];
    if (element.status !== 'OK') {
      return res.status(400).json({ error: 'Could not calculate distance. Check the addresses.' });
    }

    // Optimization 3: Calculate values only once
    const distanceMeters = element.distance.value;
    const durationSeconds = element.duration.value;
    const distanceMiles = metersToMiles(distanceMeters);

    // Optimization 4: Use Set.has() for faster lookups (O(1) vs O(n))
    const inFife = startComponents.has('fife') && destComponents.has('fife');
    const inScotland = startComponents.has('scotland') || destComponents.has('scotland');

    // Optimization 5: Combine stage and rate determination
    let stage, rate;
    if (inFife && isDaytime) {
      stage = 1;
      rate = 2.5;
    } else if (inScotland) {
      stage = 2;
      rate = 3.1;
    } else {
      stage = 3;
      rate = 2.75;
    }

    console.log('✅ Final Stage:', stage, 'Rate:', rate);

    const fare = distanceMiles * rate;

    // Optimization 6: Pre-format values to avoid multiple toFixed() calls
    const distanceMilesFormatted = distanceMiles.toFixed(2);
    const durationMinsFormatted = (durationSeconds / 60).toFixed(2);
    const rateFormatted = rate.toFixed(2);
    const fareFormatted = fare.toFixed(2);

    // Response with debug info
    res.json({
      start,
      destination,
      rate: `£${rateFormatted} per mile`,
      distance: `${distanceMilesFormatted} miles`,
      duration: `${durationMinsFormatted} mins`,
      estimatedFare: `£${fareFormatted}`,
      timeOfRequest: now.toISOString()
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Failed to calculate fare. Try again later.' });
  }
};