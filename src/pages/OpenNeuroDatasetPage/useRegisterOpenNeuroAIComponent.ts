import { useEffect } from "react";
import { useAIComponentRegistry } from "../../AIContext";
import { DatasetFile } from "../common/DatasetWorkspace/plugins/pluginInterface";
import { OpenNeuroDatasetInfo } from "./types";

const useRegisterOpenNeuroAIComponent = ({
  datasetInfo,
  error,
  loading,
}: {
  datasetInfo: OpenNeuroDatasetInfo | null;
  error: string | null;
  loading: boolean;
}) => {
  const { registerComponentForAI, unregisterComponentForAI } =
    useAIComponentRegistry();

  useEffect(() => {
    if (loading) return;

    const context = `
The user is viewing the OpenNeuroDatasetPage for dataset ${datasetInfo?.id} version ${datasetInfo?.snapshot.tag}.

${error ? `There was an error loading the dataset: ${error}` : ""}

${
  datasetInfo
    ? `Dataset Information:
- Created: ${new Date(datasetInfo.created).toLocaleDateString()}
- Total Files: ${datasetInfo.snapshot.summary.totalFiles}
- Total Size: ${datasetInfo.snapshot.size} bytes
- Downloads: ${datasetInfo.snapshot.analytics.downloads}
- Views: ${datasetInfo.snapshot.analytics.views}

The files visible are:
${datasetInfo.snapshot.files
  .slice(0, 50)
  .map(
    (f: DatasetFile) =>
      `  ${f.filename} (${f.size} bytes)${f.directory ? " (directory)" : ""}`,
  )
  .join("\n")}

The user can interact with the page by:
- Clicking on a file to view it
- Navigating through directories
- Selecting different files to view their contents`
    : "No dataset information is currently available."
}`;

    const registration = {
      id: "OpenNeuroDatasetPage",
      context,
      callbacks: [],
    };
    registerComponentForAI(registration);
    return () => unregisterComponentForAI("OpenNeuroDatasetPage");
  }, [
    registerComponentForAI,
    unregisterComponentForAI,
    datasetInfo,
    error,
    loading,
  ]);
};

export default useRegisterOpenNeuroAIComponent;
