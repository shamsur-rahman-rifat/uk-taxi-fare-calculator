// src/controller/fareController.js

import axios from 'axios';

export const calculateFare = async (req, res) => {
  const { start, destination } = req.body;

  if (!start || !destination) {
    return res.status(400).json({ error: 'Start and destination are required' });
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: start,
        destinations: destination,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    const data = response.data;
    const element = data.rows[0].elements[0];

    if (element.status !== 'OK') {
      return res.status(400).json({ error: 'Could not calculate distance. Check the addresses.' });
    }

    const distanceInMeters = element.distance.value;
    const durationInSeconds = element.duration.value;

    const distanceInKm = distanceInMeters / 1000;

    // Example fare calculation
    const baseFare = 3.0;
    const ratePerKm = 1.5;

    const fare = baseFare + distanceInKm * ratePerKm;

    res.json({
      start,
      destination,
      distance: `${distanceInKm.toFixed(2)} km`,
      duration: `${(durationInSeconds / 60).toFixed(2)} mins`,
      estimatedFare: `£${fare.toFixed(2)}`
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Failed to calculate fare. Try again later.' });
  }
};
