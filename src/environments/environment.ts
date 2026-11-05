export const environment = {
  production: false,
  BACKEND: {
    BASR_URL: 'http://localhost:5175/api',
    PANORAMIC_IMAGE_URL: 'StreetView/GetPanoramicImage',
    // PANORAMIC_IMAGE_LOCAL_IIS_PROXY removed; always use direct IIS URL
    PANORAMIC_IMAGE_LOCAL_IIS_URL: 'http://localhost/360view/original',
  },
  SATELLITE_IMAGERY: {
    exportUrl: 'sattelite.png',
  },
  GOOGLE_MAPS_API_KEY: 'AIzaSyBHx2tX6K5mUSPhr9HG7oWU2L0t232xHMQ',
};
