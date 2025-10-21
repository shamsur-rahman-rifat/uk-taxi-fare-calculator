import React, { useState } from 'react';
import axios from 'axios';
import PlacesAutocomplete, { geocodeByAddress } from 'react-places-autocomplete';
import { GoogleMap, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '12px',
};

const center = {
  lat: 51.5074,
  lng: -0.1278,
};

const FareCalculator = () => {
  const [start, setStart] = useState('');
  const [destination, setDestination] = useState('');
  const [fareData, setFareData] = useState(null);
  const [coords, setCoords] = useState({ start: null, destination: null });
  const [directions, setDirections] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isScotland, setIsScotland] = useState(false);


  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const calculateRoute = async (startCoords, destCoords) => {
    if (!window.google || !startCoords || !destCoords) return;

    const directionsService = new window.google.maps.DirectionsService();
    
    try {
      const results = await directionsService.route({
        origin: startCoords,
        destination: destCoords,
        travelMode: window.google.maps.TravelMode.DRIVING,
      });
      
      setDirections(results);
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  };

  const handleCalculateFare = async () => {
    if (!start || !destination) {
      setError('Please enter both start and destination addresses');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/calculateFare`, {
        start,
        destination,
      });

      setFareData(response.data);

      try {
        const [startGeo] = await geocodeByAddress(start);
        const [destGeo] = await geocodeByAddress(destination);

        const startLoc = startGeo.geometry.location;
        const destLoc = destGeo.geometry.location;

        const startCoords = {
          lat: startLoc.lat(),
          lng: startLoc.lng(),
        };
        
        const destCoords = {
          lat: destLoc.lat(),
          lng: destLoc.lng(),
        };

        setCoords({
          start: startCoords,
          destination: destCoords,
        });

        // Calculate route after setting coordinates
        await calculateRoute(startCoords, destCoords);
      } catch (mapError) {
        console.error("Failed to get coordinates for map:", mapError);
      }
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.error || 'Failed to calculate fare. Please try again with UK Adress.');
    } finally {
      const isScotland =
        start.toLowerCase().includes("scotland") ||
        destination.toLowerCase().includes("scotland");
      setIsScotland(isScotland);      
      setLoading(false);
    }
  };

  const handleChange = (setFn) => (value) => {
    setFn(value);
    setError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCalculateFare();
    }
  };

  if (!isLoaded) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px', backgroundColor: '#000' }}>
        <div className="spinner-border text-warning" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 py-md-5" style={{ backgroundColor: '#000', minHeight: '100vh' }}>
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10 col-xl-9">
          {/* Header */}
          <div className="text-center mb-4 mb-md-5">
            <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" 
                 style={{ 
                   width: '80px', 
                   height: '80px', 
                   backgroundColor: '#FFC107',
                   boxShadow: '0 8px 24px rgba(255, 193, 7, 0.3)'
                 }}>
              <img 
                src="https://www.dastaxis.co.uk/wp-content/uploads/2025/05/Das-Taxis-Logo-scaled.png"
                alt="Das Taxis Logo"
                style={{ width: '80px', height: 'auto', borderRadius: '8px', objectFit: 'contain' }}
              />
            </div>
            <h1 className="h2 mb-2 fw-bold" style={{ color: '#FFC107' }}>UK Taxi Fare Calculator</h1>
            <p className="text-white-50 mb-0">Get instant fare estimates for your journey across the UK</p>
          </div>

          {/* Main Card */}
          <div className="card border-0 mb-4" style={{ backgroundColor: '#1a1a1a', boxShadow: '0 8px 32px rgba(255, 193, 7, 0.1)' }}>
            <div className="card-body p-4 p-md-5">
              {/* Input Fields */}
              <div className="row g-4 mb-4">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold" style={{ color: '#FFC107' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-geo-alt-fill me-2" viewBox="0 0 16 16">
                      <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                    </svg>
                    Start Address
                  </label>
                  <PlacesAutocomplete
                    value={start}
                    onChange={handleChange(setStart)}
                  >
                    {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
                      <div className="position-relative">
                        <input
                          {...getInputProps({
                            placeholder: 'Enter pickup location',
                            className: 'form-control form-control-lg custom-input',
                            onKeyPress: handleKeyPress,
                          })}
                        />
                        {(loading || suggestions.length > 0) && (
                          <div className="list-group position-absolute w-100 shadow-lg custom-dropdown" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
                            {loading && (
                              <div className="list-group-item" style={{ backgroundColor: '#2a2a2a', borderColor: '#3a3a3a' }}>
                                <small style={{ color: '#FFC107' }}>Loading suggestions...</small>
                              </div>
                            )}
                            {suggestions.map((suggestion) => (
                              <button
                                key={suggestion.placeId}
                                {...getSuggestionItemProps(suggestion, {
                                  className: `list-group-item list-group-item-action custom-suggestion ${suggestion.active ? 'active' : ''}`,
                                })}
                                type="button"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-geo-alt me-2" viewBox="0 0 16 16">
                                  <path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A31.493 31.493 0 0 1 8 14.58a31.481 31.481 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94zM8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z"/>
                                  <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                                </svg>
                                <small>{suggestion.description}</small>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </PlacesAutocomplete>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold" style={{ color: '#FFC107' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-geo-fill me-2" viewBox="0 0 16 16">
                      <path fillRule="evenodd" d="M4 4a4 4 0 1 1 4.5 3.969V13.5a.5.5 0 0 1-1 0V7.97A4 4 0 0 1 4 3.999zm2.493 8.574a.5.5 0 0 1-.411.575c-.712.118-1.28.295-1.655.493a1.319 1.319 0 0 0-.37.265.301.301 0 0 0-.057.09V14l.002.008a.147.147 0 0 0 .016.033.617.617 0 0 0 .145.15c.165.13.435.27.813.395.751.25 1.82.414 3.024.414s2.273-.163 3.024-.414c.378-.126.648-.265.813-.395a.619.619 0 0 0 .146-.15.148.148 0 0 0 .015-.033L12 14v-.004a.301.301 0 0 0-.057-.09 1.318 1.318 0 0 0-.37-.264c-.376-.198-.943-.375-1.655-.493a.5.5 0 1 1 .164-.986c.77.127 1.452.328 1.957.594C12.5 13 13 13.4 13 14c0 .426-.26.752-.544.977-.29.228-.68.413-1.116.558-.878.293-2.059.465-3.34.465-1.281 0-2.462-.172-3.34-.465-.436-.145-.826-.33-1.116-.558C3.26 14.752 3 14.426 3 14c0-.599.5-1 .961-1.243.505-.266 1.187-.467 1.957-.594a.5.5 0 0 1 .575.411z"/>
                    </svg>
                    Destination Address
                  </label>
                  <PlacesAutocomplete
                    value={destination}
                    onChange={handleChange(setDestination)}
                  >
                    {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
                      <div className="position-relative">
                        <input
                          {...getInputProps({
                            placeholder: 'Enter drop-off location',
                            className: 'form-control form-control-lg custom-input',
                            onKeyPress: handleKeyPress,
                          })}
                        />
                        {(loading || suggestions.length > 0) && (
                          <div className="list-group position-absolute w-100 shadow-lg custom-dropdown" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
                            {loading && (
                              <div className="list-group-item" style={{ backgroundColor: '#2a2a2a', borderColor: '#3a3a3a' }}>
                                <small style={{ color: '#FFC107' }}>Loading suggestions...</small>
                              </div>
                            )}
                            {suggestions.map((suggestion) => (
                              <button
                                key={suggestion.placeId}
                                {...getSuggestionItemProps(suggestion, {
                                  className: `list-group-item list-group-item-action custom-suggestion ${suggestion.active ? 'active' : ''}`,
                                })}
                                type="button"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-geo-alt me-2" viewBox="0 0 16 16">
                                  <path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A31.493 31.493 0 0 1 8 14.58a31.481 31.481 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94zM8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z"/>
                                  <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                                </svg>
                                <small>{suggestion.description}</small>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </PlacesAutocomplete>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="alert alert-danger d-flex align-items-center mb-4" role="alert" style={{ backgroundColor: '#dc3545', borderColor: '#dc3545', color: '#fff' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-exclamation-triangle-fill me-2 flex-shrink-0" viewBox="0 0 16 16">
                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                  </svg>
                  <div>{error}</div>
                </div>
              )}

              {/* Calculate Button */}
              <button
                onClick={handleCalculateFare}
                disabled={loading}
                className="btn btn-lg w-100 d-flex align-items-center justify-content-center custom-btn"
                style={{ height: '60px' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    <span className="fw-bold">Calculating Fare...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" className="bi bi-calculator me-2" viewBox="0 0 16 16">
                      <path d="M12 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h8zM4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4z"/>
                      <path d="M4 2.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-2zm0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3-6a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3-6a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm0 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-4z"/>
                    </svg>
                    <span className="fw-bold">Calculate Fare</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Fare Results */}
          {fareData && (
            <div className="card border-0 mb-4 animate__fadeIn" style={{ backgroundColor: '#1a1a1a', boxShadow: '0 8px 32px rgba(255, 193, 7, 0.15)' }}>
              <div className="card-header py-3" style={{ backgroundColor: '#FFC107', borderBottom: 'none' }}>
<div className="d-flex justify-content-between align-items-center flex-wrap">
  <h3 className="h5 mb-0 fw-bold" style={{ color: '#000' }}>
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" className="bi bi-receipt me-2" viewBox="0 0 16 16">
      <path d="M1.92.506a.5.5..." />
      <path d="M3 4.5..." />
    </svg>
    Your Estimated Fare
  </h3>

  {isScotland && (
    <a
      href="https://www.dastaxis.co.uk/booking/"
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-warning fw-bold px-4 py-2"
      style={{
        borderRadius: "8px",
        backgroundColor: "#FFC107",
        color: "#000",
        textDecoration: "none",
      }}
    >
      Book Now
    </a>
  )}
</div>          
              </div>
              <div className="card-body p-4">
                <div className="row g-3 mb-4">
                  <div className="col-12 col-sm-6">
                    <div className="d-flex align-items-start p-3 rounded" style={{ backgroundColor: '#2a2a2a' }}>
                      <div className="rounded p-2 me-3" style={{ backgroundColor: 'rgba(255, 193, 7, 0.2)' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#FFC107" className="bi bi-geo-alt-fill" viewBox="0 0 16 16">
                          <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                        </svg>
                      </div>
                      <div className="flex-grow-1">
                        <small className="d-block mb-2" style={{ color: '#FFC107' }}>Pickup Location</small>
                        <p className="mb-0 fw-medium text-white">{fareData.start}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div className="d-flex align-items-start p-3 rounded" style={{ backgroundColor: '#2a2a2a' }}>
                      <div className="rounded p-2 me-3" style={{ backgroundColor: 'rgba(255, 193, 7, 0.2)' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#FFC107" className="bi bi-geo-fill" viewBox="0 0 16 16">
                          <path fillRule="evenodd" d="M4 4a4 4 0 1 1 4.5 3.969V13.5a.5.5 0 0 1-1 0V7.97A4 4 0 0 1 4 3.999zm2.493 8.574a.5.5 0 0 1-.411.575c-.712.118-1.28.295-1.655.493a1.319 1.319 0 0 0-.37.265.301.301 0 0 0-.057.09V14l.002.008a.147.147 0 0 0 .016.033.617.617 0 0 0 .145.15c.165.13.435.27.813.395.751.25 1.82.414 3.024.414s2.273-.163 3.024-.414c.378-.126.648-.265.813-.395a.619.619 0 0 0 .146-.15.148.148 0 0 0 .015-.033L12 14v-.004a.301.301 0 0 0-.057-.09 1.318 1.318 0 0 0-.37-.264c-.376-.198-.943-.375-1.655-.493a.5.5 0 1 1 .164-.986c.77.127 1.452.328 1.957.594C12.5 13 13 13.4 13 14c0 .426-.26.752-.544.977-.29.228-.68.413-1.116.558-.878.293-2.059.465-3.34.465-1.281 0-2.462-.172-3.34-.465-.436-.145-.826-.33-1.116-.558C3.26 14.752 3 14.426 3 14c0-.599.5-1 .961-1.243.505-.266 1.187-.467 1.957-.594a.5.5 0 0 1 .575.411z"/>
                        </svg>
                      </div>
                      <div className="flex-grow-1">
                        <small className="d-block mb-2" style={{ color: '#FFC107' }}>Drop-off Location</small>
                        <p className="mb-0 fw-medium text-white">{fareData.destination}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-6 col-lg-3">
                    <div className="text-center p-3 rounded h-100" style={{ backgroundColor: '#2a2a2a', border: '2px solid #3a3a3a' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#FFC107" className="bi bi-speedometer2 mb-2" viewBox="0 0 16 16">
                        <path d="M8 4a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V4.5A.5.5 0 0 1 8 4zM3.732 5.732a.5.5 0 0 1 .707 0l.915.914a.5.5 0 1 1-.708.708l-.914-.915a.5.5 0 0 1 0-.707zM2 10a.5.5 0 0 1 .5-.5h1.586a.5.5 0 0 1 0 1H2.5A.5.5 0 0 1 2 10zm9.5 0a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12a.5.5 0 0 1-.5-.5zm.754-4.246a.389.389 0 0 0-.527-.02L7.547 9.31a.91.91 0 1 0 1.302 1.258l3.434-4.297a.389.389 0 0 0-.029-.518z"/>
                        <path fillRule="evenodd" d="M0 10a8 8 0 1 1 15.547 2.661c-.442 1.253-1.845 1.602-2.932 1.25C11.309 13.488 9.475 13 8 13c-1.474 0-3.31.488-4.615.911-1.087.352-2.49.003-2.932-1.25A7.988 7.988 0 0 1 0 10zm8-7a7 7 0 0 0-6.603 9.329c.203.575.923.876 1.68.63C4.397 12.533 6.358 12 8 12s3.604.532 4.923.96c.757.245 1.477-.056 1.68-.631A7 7 0 0 0 8 3z"/>
                      </svg>
                      <div className="small mb-1" style={{ color: '#999' }}>Distance</div>
                      <div className="fw-bold text-white fs-6">{fareData.distance}</div>
                    </div>
                  </div>
                  <div className="col-6 col-lg-3">
                    <div className="text-center p-3 rounded h-100" style={{ backgroundColor: '#2a2a2a', border: '2px solid #3a3a3a' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#FFC107" className="bi bi-clock mb-2" viewBox="0 0 16 16">
                        <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                      </svg>
                      <div className="small mb-1" style={{ color: '#999' }}>Duration</div>
                      <div className="fw-bold text-white fs-6">{fareData.duration}</div>
                    </div>
                  </div>
                  <div className="col-12 col-lg-6">
                    <div className="text-center p-3 rounded h-100 d-flex flex-column justify-content-center" style={{ backgroundColor: '#FFC107' }}>
                      <div className="small mb-1 fw-semibold" style={{ color: '#000' }}>Estimated Fare</div>
                      <div className="h2 fw-bold mb-0" style={{ color: '#000' }}>{fareData.estimatedFare}</div>
                    </div>
                  </div>
                </div>

                <div className="alert mb-0 d-flex align-items-start" role="alert" style={{ backgroundColor: '#2a2a2a', border: '1px solid #FFC107', borderLeft: '4px solid #FFC107' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="#FFC107" className="bi bi-info-circle-fill me-3 mt-1 flex-shrink-0" viewBox="0 0 16 16">
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                </svg>
                <div className="small text-white">
                    <strong style={{ color: '#FFC107' }}>Pricing Information</strong>
                    <div className="mt-2">
                    <p className="mb-2">
                        Please note that the calculated taxi fares are always only estimates based on distance, travel time and the respective taxi fare. The calculated fares are not binding and are for information purposes only.
                    </p>
                    </div>
                </div>
                </div>
              </div>
            </div>
          )}

          {/* Map */}
          {directions && (
            <div className="card border-0" style={{ backgroundColor: '#1a1a1a', boxShadow: '0 8px 32px rgba(255, 193, 7, 0.1)' }}>
              <div className="card-header py-3" style={{ backgroundColor: '#2a2a2a', borderBottom: '2px solid #FFC107' }}>
                <h3 className="h5 mb-0 fw-semibold" style={{ color: '#FFC107' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" className="bi bi-map me-2" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M15.817.113A.5.5 0 0 1 16 .5v14a.5.5 0 0 1-.402.49l-5 1a.502.502 0 0 1-.196 0L5.5 15.01l-4.902.98A.5.5 0 0 1 0 15.5v-14a.5.5 0 0 1 .402-.49l5-1a.5.5 0 0 1 .196 0L10.5.99l4.902-.98a.5.5 0 0 1 .415.103zM10 1.91l-4-.8v12.98l4 .8V1.91zm1 12.98 4-.8V1.11l-4 .8v12.98zm-6-.8V1.11l-4 .8v12.98l4-.8z"/>
                  </svg>
                  Route Map
                </h3>
              </div>
              <div className="card-body p-0">
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={coords.start || center}
                  zoom={8}
                >
                  <DirectionsRenderer 
                    directions={directions}
                    options={{
                      polylineOptions: {
                        strokeColor: '#FFC107',
                        strokeOpacity: 0.9,
                        strokeWeight: 5,
                      },
                      markerOptions: {
                        zIndex: 100,
                      }
                    }}
                  />
                </GoogleMap>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        body {
          background-color: #000 !important;
        }

        .custom-input {
          background-color: #2a2a2a !important;
          border: 2px solid #3a3a3a !important;
          color: #fff !important;
          transition: all 0.3s ease;
        }

        .custom-input:focus {
          background-color: #2a2a2a !important;
          border-color: #FFC107 !important;
          box-shadow: 0 0 0 0.25rem rgba(255, 193, 7, 0.15) !important;
          color: #fff !important;
        }

        .custom-input::placeholder {
          color: #777 !important;
        }

        .custom-dropdown {
          background-color: #2a2a2a;
          border: 1px solid #3a3a3a;
          border-radius: 8px;
          margin-top: 4px;
        }

        .custom-suggestion {
          background-color: #2a2a2a !important;
          border-color: #3a3a3a !important;
          color: #fff !important;
          transition: all 0.2s ease;
        }

        .custom-suggestion:hover {
          background-color: #3a3a3a !important;
          color: #FFC107 !important;
        }

        .custom-suggestion.active {
          background-color: #FFC107 !important;
          border-color: #FFC107 !important;
          color: #000 !important;
        }

        .custom-btn {
          background: linear-gradient(135deg, #FFC107 0%, #FFD54F 100%);
          border: none;
          color: #000;
          font-weight: 700;
          letter-spacing: 0.5px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
        }

        .custom-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #FFD54F 0%, #FFC107 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 193, 7, 0.4);
          color: #000;
        }

        .custom-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .custom-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .animate__fadeIn {
          animation: fadeIn 0.6s ease-in;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .card {
          transition: all 0.3s ease;
        }

        .card:hover {
          box-shadow: 0 12px 40px rgba(255, 193, 7, 0.2) !important;
        }

        @media (max-width: 576px) {
          .card-body {
            padding: 1.5rem !important;
          }
        }

        /* Scrollbar Styling */
        .custom-dropdown::-webkit-scrollbar {
          width: 8px;
        }

        .custom-dropdown::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 4px;
        }

        .custom-dropdown::-webkit-scrollbar-thumb {
          background: #FFC107;
          border-radius: 4px;
        }

        .custom-dropdown::-webkit-scrollbar-thumb:hover {
          background: #FFD54F;
        }
      `}</style>
    </div>
  );
};

export default FareCalculator;