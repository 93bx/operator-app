# Mobile App Development Guide

## Overview
The Operator App mobile application is built with React Native and Expo, providing offline-first functionality for water station operators.

## Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (for iOS development)
- Android Studio (for Android development)
- Physical device for testing

## Development Setup

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Start Development Server
```bash
# Start Expo development server
npm start

# Or run on specific platforms
npm run android
npm run ios
```

### 3. Environment Configuration
Create `mobile/.env`:
```env
API_BASE_URL=http://localhost:3001/api
```

## Project Structure

```
mobile/
├── src/
│   ├── components/          # Reusable UI components
│   ├── contexts/           # React contexts (Auth, Language, etc.)
│   ├── navigation/         # Navigation configuration
│   ├── screens/           # Screen components
│   ├── services/          # API and data services
│   ├── types/             # TypeScript type definitions
│   ├── theme/             # App theme configuration
│   ├── i18n/              # Internationalization
│   └── config/            # Configuration files
├── assets/                # Images, fonts, etc.
├── App.tsx               # Main app component
└── package.json
```

## Key Features

### 1. Offline-First Architecture
- SQLite database for local data storage
- Automatic sync when online
- Conflict resolution for data updates

### 2. Bilingual Support
- Arabic (default) and English
- RTL/LTR layout support
- Dynamic language switching

### 3. Authentication
- JWT-based authentication
- Secure token storage
- Automatic token refresh

### 4. Data Management
- Local SQLite database
- Offline data collection
- Background sync

## Core Components

### Authentication Context
```typescript
const { user, login, logout, isAuthenticated } = useAuth();
```

### Language Context
```typescript
const { language, setLanguage, isRTL } = useLanguage();
```

### Offline Context
```typescript
const { isOnline, isOffline, connectionType } = useOffline();
```

### Sync Context
```typescript
const { isSyncing, syncAll, hasUnsyncedData } = useSync();
```

## Data Services

### DataService
Local database operations:
```typescript
// Save reading
await dataService.saveReading(readingData);

// Get readings
const readings = await dataService.getReadings();

// Save fault
await dataService.saveFault(faultData);
```

### SyncService
Offline sync operations:
```typescript
// Sync all data
const result = await syncService.syncAll();

// Get sync status
const status = await syncService.getSyncStatus();
```

### FileService
File upload and management:
```typescript
// Take photo
const result = await fileService.takePhoto();

// Upload file
const uploadResult = await fileService.uploadFile(uri);
```

## Navigation Structure

### Main Navigation (Bottom Tabs)
- Dashboard
- Stations
- Readings
- Faults
- Profile

### Stack Navigators
Each tab has its own stack navigator for nested screens.

## Screen Components

### Dashboard Screen
- Overview of assigned stations
- Recent readings summary
- Open faults count
- Quick action buttons

### Stations Screen
- List of assigned stations
- Station status indicators
- Map view integration

### Readings Screen
- List of daily readings
- Add new reading form
- Reading history

### Faults Screen
- List of reported faults
- Add new fault form
- Fault status management

### Profile Screen
- User information
- Settings
- Language selection
- Logout

## Forms and Validation

### Reading Form
```typescript
interface ReadingFormData {
  stationId: string;
  readingDate: string;
  phLevel?: number;
  tdsLevel?: number;
  temperature?: number;
  pressure?: number;
  tankLevelPercentage?: number;
  notes?: string;
  notesAr?: string;
}
```

### Fault Form
```typescript
interface FaultFormData {
  stationId: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
}
```

## Offline Functionality

### Data Storage
- SQLite database for local storage
- Automatic data persistence
- Conflict resolution

### Sync Process
1. Check online status
2. Upload unsynced data
3. Download server updates
4. Mark data as synced

### Error Handling
- Network error handling
- Sync failure recovery
- Data validation

## Push Notifications

### Setup
```typescript
// Request permissions
const hasPermission = await requestNotificationPermissions();

// Schedule notification
const notificationId = await scheduleNotification(
  'New Fault',
  'A new fault has been reported'
);
```

### Notification Types
- New fault assignments
- Sync completion
- Connection status changes

## File Upload

### Photo Capture
```typescript
// Take photo
const result = await fileService.takePhoto();

// Select from gallery
const result = await fileService.selectPhoto();
```

### File Upload
```typescript
// Upload file
const uploadResult = await fileService.uploadFile(uri);

if (uploadResult.success) {
  // Use uploaded file URL
  const photoUrl = uploadResult.uri;
}
```

## Internationalization

### Translation Keys
```typescript
// Use translations
const { t } = useTranslation();

// Example
<Text>{t('dashboard.title')}</Text>
```

### Language Switching
```typescript
// Switch language
await setLanguage('en'); // or 'ar'
```

## Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

## Building for Production

### Android
```bash
# Build APK
expo build:android

# Or use EAS Build
eas build --platform android
```

### iOS
```bash
# Build for iOS
expo build:ios

# Or use EAS Build
eas build --platform ios
```

## Performance Optimization

### Image Optimization
- Compress images before upload
- Use appropriate image formats
- Implement lazy loading

### Database Optimization
- Use indexes for queries
- Implement pagination
- Clean up old data

### Memory Management
- Proper component unmounting
- Image memory cleanup
- Avoid memory leaks

## Debugging

### Development Tools
- React Native Debugger
- Flipper
- Expo DevTools

### Common Issues
1. **Metro bundler issues**: Clear cache with `expo start -c`
2. **iOS simulator issues**: Reset simulator
3. **Android build issues**: Clean gradle cache

## Deployment

### App Store (iOS)
1. Build production app
2. Upload to App Store Connect
3. Submit for review

### Google Play (Android)
1. Build production APK/AAB
2. Upload to Google Play Console
3. Submit for review

## Security Considerations

### Data Protection
- Encrypt sensitive data
- Secure API communication
- Validate all inputs

### Authentication
- Secure token storage
- Automatic token refresh
- Logout on token expiry

### File Upload
- Validate file types
- Compress images
- Secure file storage

## Troubleshooting

### Common Issues

1. **App won't start**
   - Check dependencies
   - Clear Metro cache
   - Restart development server

2. **Sync not working**
   - Check network connection
   - Verify API endpoints
   - Check sync logs

3. **Database errors**
   - Check database initialization
   - Verify table schemas
   - Check data types

### Debug Commands
```bash
# Clear Expo cache
expo start -c

# Reset Metro cache
npx react-native start --reset-cache

# Check logs
expo logs
```

## Best Practices

### Code Organization
- Use TypeScript for type safety
- Implement proper error handling
- Follow React Native best practices

### Performance
- Optimize images and assets
- Use FlatList for large lists
- Implement proper loading states

### User Experience
- Provide offline feedback
- Show sync status
- Handle network errors gracefully

### Security
- Validate all inputs
- Use secure storage
- Implement proper authentication
