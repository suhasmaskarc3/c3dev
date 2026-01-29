# Dark Mode Toggle - User Guide

## Where to Find Dark Mode

The dark mode toggle button is located in the **navigation bar** on the left side of the screen.

### Location
- **Position**: Bottom of the left navigation bar
- **Icon**: 
  - 🌙 Moon icon (when in light mode - click to switch to dark)
  - ☀️ Sun icon (when in dark mode - click to switch to light)

## How to Use Dark Mode

### Toggling Dark Mode

1. **Locate the Toggle Button**
   - Look at the left navigation bar
   - Find the moon/sun icon button at the bottom of the navigation bar

2. **Click to Toggle**
   - Click the button to switch between light and dark modes
   - The change happens instantly across the entire application

3. **Visual Feedback**
   - The icon changes to reflect the current mode
   - All UI components update to use the selected theme
   - Maps automatically switch between light and dark tile sets

### Features

#### Persistent Theme Selection
- Your theme preference is automatically saved in browser's local storage
- When you return to the application, your last selected theme will be restored
- Works across browser tabs and sessions

#### What Changes in Dark Mode

When dark mode is enabled:
- **Background**: Dark gray (#121212) instead of white
- **Navigation Bar**: Darker surface (#1e1e1e) with lighter borders
- **Text**: White text on dark backgrounds for better readability
- **Maps**: Automatically switches to dark map tiles from CartoDB
- **Buttons and Controls**: Adapted colors for better dark mode visibility
- **Hover Effects**: Optimized for dark backgrounds

#### What Changes in Light Mode

When light mode is enabled (default):
- **Background**: Clean white background
- **Navigation Bar**: Light gray (#f5f5f5) surface
- **Text**: Dark text for optimal readability
- **Maps**: Light map tiles from CartoDB
- **Standard Color Scheme**: Traditional light UI elements

### Accessibility

The dark mode toggle includes:
- **Tooltip**: Hover over the button to see "Switch to Dark Mode" or "Switch to Light Mode"
- **Clear Icons**: Universally recognized sun and moon icons
- **High Contrast**: Both themes maintain WCAG AA contrast ratios
- **Smooth Transitions**: Instant theme switching without page reload

## Technical Details

### Theme Colors

**Light Theme:**
- Background: #ffffff
- Surface: #f5f5f5
- Border: #e0e0e0
- Text: #000000
- Text Secondary: #666666

**Dark Theme:**
- Background: #121212
- Surface: #1e1e1e
- Border: #2d2d2d
- Text: #ffffff
- Text Secondary: #b0b0b0

### Files Modified

The dark mode implementation includes:
- `/uiProject/ui/c3/src/contexts/ThemeContext.tsx` - Theme state management
- `/uiProject/ui/c3/src/theme/colors.ts` - Theme color definitions
- `/uiProject/ui/c3/src/components/nav/NavBar.tsx` - Toggle button component
- All page components - Theme integration

### Browser Compatibility

Dark mode works on all modern browsers that support:
- localStorage API
- CSS styling
- React hooks (useState, useEffect, useContext)

## Troubleshooting

### Theme Not Persisting
If your theme preference doesn't save between sessions:
1. Check that your browser allows localStorage
2. Ensure cookies/local storage are not cleared on exit
3. Try a different browser

### Theme Not Applying
If clicking the toggle doesn't change the theme:
1. Refresh the page
2. Clear browser cache
3. Check browser console for errors

### Maps Not Updating
If map tiles don't switch with the theme:
1. Wait a few seconds for tiles to reload
2. Zoom in/out to force tile refresh
3. Refresh the page if issue persists

## Support

For issues or questions about dark mode:
1. Check this documentation first
2. Look for console errors in browser developer tools
3. Contact your system administrator
