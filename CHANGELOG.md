# Changes

## February 25, 2025
- Improved TimeIntervals visualization with interactive Plotly-based view that shows hover information and uses transparency to indicate overlapping intervals (fixes #278)
- Improved TimeIntervals plot by removing the top line and adjusting rectangles to start at y=0 for cleaner visualization
- Enhanced TimeIntervals controls by adding start time, duration, and interval count information and removing the gap between controls and plot
- Added reset button to TSV table view to restore original row order
- Added collapsible left panel with toggle button to improve workspace utilization
- Added AI context integration for NwbPage to provide information about currently viewed NWB file including version, contents overview, and available interactions
- Rewrote NIFTI viewer implementation using niivue library to provide advanced visualization features including multiplanar views and 3D rendering
- Added file size warning for NIFTI files larger than 100MB to prevent performance issues with large datasets
- Changed units controller navigation arrows in Raster plot from left/right to up/down for better visual representation
- Improved Raster plot UI with better layout and styling:
  - Removed gap between controls and plot for better visual association
  - Enhanced recording info display with cleaner styling and improved readability
  - Made controls layout responsive to screen width
- Modified ResponsiveLayout to determine mobile view based on initial browser width rather than using media queries and dynamic resizing

## February 24, 2025
- Added AI context integration for DandisetOverview component to provide comprehensive dataset information including name, description, contributors, dataset details, license, citation, keywords, species, and research methods
- Improved visibility of x-axis label in Raster Plot by adjusting font properties and grid display

## February 22, 2025
- Remove tab parameter from URL query string once page has been loaded

## February 21, 2025
- Added Events plugin view for NWB files that visualizes event timestamps with vertical markers
- Added AI Context system for parent window communication
- Added IntervalSeries plugin view for NWB files that visualizes alternating positive/negative interval data
- Updated OpenNeuro Browser's search mechanism to use a more robust state management pattern with scheduled search functionality

## February 20, 2025
- Added user management interface in Settings page for administrators
- Added admin secret key field in Settings for accessing user management
- Added ability to create, edit, and delete users with research descriptions
- Added user list view with basic information display
- Added confirmation dialog for user deletion to prevent accidental removal
- Added API key viewing capability for administrators with copy to clipboard functionality

## February 19, 2025
- Added advanced search mode for DANDI Archive Browser with neurodata type filtering
- Added matching files count indicator for advanced search results in DANDI Archive Browser
- Added horizontal spacing around splitter bar in HorizontalSplitter component
- Add SpikeDensity plugin view for NWB files
- Added job resubmission capability for failed jobs
- Added optional rastermap sorting to SpikeDensity plugin with UI controls for computing and toggling the sorting

## February 18, 2025
- Added distributed job processing system (neurosift-job-manager)
- Added support for embedded=1 query parameter
- Added feedback/issues link on home page footer
- Migration to v2 deployed
- Added external website links to DANDI and OpenNeuro browser pages

## February 17, 2025
- Added SNIRF file support with HDF5 viewer integration
- Added loading indicator when expanding directories in the file browser
- Added WAV file plugin with audio playback and waveform visualization
- Updated URL query parameter mapping between v1 to v2
- Adjusted home page layout
