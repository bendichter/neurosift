# neurosift v2 (Work in Progress)

This repository contains a work-in-progress new version of neurosift. The current stable version is maintained at [neurosift](https://github.com/flatironinstitute/neurosift).

The live version of this app can be found at [https://v2.neurosift.app](https://v2.neurosift.app).

## Getting Started

Follow these steps to install and run the app locally in development mode:

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd neurosift
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The development server typically runs on [http://localhost:5173](http://localhost:5173).

## Contributions

Pull requests are welcomed. If you have suggestions, improvements, or bug fixes, please feel free to open a pull request.

### Code Formatting

This project uses pre-commit hooks to automatically check format code before each commit. The formatting includes:
- Python code formatting using black
- TypeScript/JavaScript code formatting using npm scripts

To set up the pre-commit hooks after cloning the repository:

1. Install pre-commit:
```bash
pip install pre-commit
```

2. Install the git hook scripts:
```bash
pre-commit install
```

After this setup, code will be automatically checked for formatting when you make a commit.

Running `./devel/format_code.sh` which will format all code in the repository.

## Example Views

The following table provides example visualizations of different neurodata types through Neurosift:

| Neurodata Type | Name | Dandiset ID | Example Link |
|----------------|------|-------------|----------|
| Image | maximum_intensity_projection | 000728 | [View](http://v2.neurosift.app/nwb?url=https://api.dandiarchive.org/api/assets/f02db27e-82eb-41dd-865a-a08bb41491da/download/&dandisetId=000728&dandisetVersion=0.240827.1809&tab=/processing/ophys/SummaryImages/maximum_intensity_projection) |
| Images | StimulusPresentation/indexed_images | 000673 | [View](https://v2.neurosift.app/nwb?url=https://api.dandiarchive.org/api/assets/65a7e913-45c7-48db-bf19-b9f5e910110a/download/&dandisetId=000673&dandisetVersion=0.250122.0110&tab=/stimulus/presentation/StimulusPresentation/indexed_images) |

URL Structure:
```
https://v2.neurosift.app/nwb?url={asset_download_url}&dandisetId={id}&dandisetVersion={version}&tab={path_to_data}
```

## License

This project is licensed under the Apache 2.0 License.
