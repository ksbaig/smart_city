# Google Maps API Setup Guide

## Overview
This guide explains how to set up your own Google Maps API key for the Street View 360° integration.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" at the top
3. Click "NEW PROJECT"
4. Enter project name: "Smart Banking Street View"
5. Click "CREATE"
6. Wait for the project to be created

## Step 2: Enable Required APIs

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Maps JavaScript API"
3. Click on it and click **ENABLE**
4. Go back to Library
5. Search for "Street View API"
6. Click on it and click **ENABLE**

## Step 3: Create an API Key

1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **API Key**
3. A new API key will be created and displayed
4. Copy the API key

## Step 4: Configure API Key Restrictions

1. Click on the API key you just created to open its details
2. Under **Application restrictions**, select **HTTP referrers (web sites)**
3. Add your domain(s):
   - Development: `http://localhost:4200/*`
   - Production: `https://yourdomain.com/*`
4. Under **API restrictions**, select **Restrict key**
5. In the dropdown, select only:
   - Maps JavaScript API
   - Street View API
6. Click **SAVE**

## Step 5: Update Your Application

1. Open `src/environments/environment.ts`
2. Replace the placeholder API key:
   ```typescript
   GOOGLE_MAPS_API_KEY: 'YOUR_API_KEY_HERE'
   ```
3. For production, also update `src/environments/environment.prod.ts`

## Step 6: Configure Billing

1. In Google Cloud Console, go to **Billing**
2. Ensure you have a billing account set up
3. Link your project to the billing account
4. Google Maps APIs are free for the first $200/month in credits
5. Monitor your usage to stay within free tier

## Step 7: Test the Integration

1. Start your Angular application:
   ```bash
   npm start
   # or
   ng serve
   ```
2. Navigate to `http://localhost:4200`
3. Search for a location (ATM, Branch, etc.)
4. Click the "360view" button
5. Verify the Street View panel opens with panorama

## Troubleshooting

### "Google Maps API is not loaded"
- Check that the API key is correctly set in `environment.ts`
- Check browser console for error messages
- Verify API restrictions allow your domain
- Check that Maps JavaScript API and Street View API are enabled

### "Street View imagery is not available near this location"
- Not all locations have Street View coverage
- Try searching for major roads or city centers in Riyadh
- The algorithm searches at 100m, 250m, and 500m radius

### "Failed to load Street View"
- Check browser console for CORS errors
- Verify API key restrictions include your domain
- Check that billing is enabled for your Google Cloud project

### High API Costs
- Monitor your usage in Google Cloud Console
- Street View API charges $4-$7 per 1000 panorama requests
- Consider implementing request throttling for high-traffic scenarios

## Cost Optimization

1. **Caching**: Consider caching panorama data to reduce API calls
2. **Radius Search Optimization**: Adjust the search radius strategy if needed
3. **Usage Limits**: Set quotas in Google Cloud to prevent unexpected charges
4. **Billing Alerts**: Set up budget alerts in Google Cloud Console

## Production Considerations

1. **HTTPS Only**: Ensure your production domain uses HTTPS
2. **API Key Rotation**: Consider rotating API keys regularly
3. **Monitoring**: Set up monitoring and alerting for API errors
4. **Rate Limiting**: Implement client-side rate limiting if needed
5. **User Feedback**: Provide clear messages for API errors

## Support Resources

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Street View API Guide](https://developers.google.com/maps/documentation/javascript/streetview)
- [Google Cloud Support](https://cloud.google.com/support)
- [API Key Setup Guide](https://developers.google.com/maps/gmp-get-started)

## Quick Reference

| Item | Value |
|------|-------|
| Service | Google Street View API |
| Monthly Free Tier | $200 in credits |
| Pay-as-you-go Rate | $4-$7 per 1,000 requests |
| Setup Time | ~10 minutes |
| Key Location | `src/environments/environment.ts` |
