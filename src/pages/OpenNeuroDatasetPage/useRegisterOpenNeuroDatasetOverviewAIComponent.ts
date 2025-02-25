import { useEffect } from "react";
import { useAIComponentRegistry } from "../../AIContext";
import { OpenNeuroDatasetInfo } from "./types";

const useRegisterOpenNeuroDatasetOverviewAIComponent = ({
  datasetInfo,
}: {
  datasetInfo: OpenNeuroDatasetInfo;
}) => {
  const { registerComponentForAI, unregisterComponentForAI } =
    useAIComponentRegistry();

  useEffect(() => {
    const context = `
The user is viewing details about an OpenNeuro dataset with the following information:

Name: ${datasetInfo.snapshot.description.Name}

Authors: ${datasetInfo.snapshot.description.Authors?.join(" • ") || "Not provided"}

Dataset Information:
- ID: ${datasetInfo.id}
- Version: ${datasetInfo.snapshot.tag}
- Created: ${new Date(datasetInfo.snapshot.created).toLocaleDateString()}
- Total Size: ${datasetInfo.snapshot.size} bytes
- Downloads: ${datasetInfo.snapshot.analytics.downloads}
- Views: ${datasetInfo.snapshot.analytics.views}
- Total Files: ${datasetInfo.snapshot.summary.totalFiles}

Summary:
- Modalities: ${datasetInfo.snapshot.summary.modalities?.join(", ") || "Not provided"}
- Sessions: ${datasetInfo.snapshot.summary.sessions.length} session(s)
- Subjects: ${datasetInfo.snapshot.summary.subjects.length} subject(s)

DOI: ${datasetInfo.snapshot.description.DatasetDOI || "Not provided"}

License: ${datasetInfo.snapshot.description.License || "Not provided"}

Acknowledgements: ${datasetInfo.snapshot.description.Acknowledgements || "Not provided"}

Funding: ${datasetInfo.snapshot.description.Funding || "Not provided"}

References and Links: ${
      datasetInfo.snapshot.description.ReferencesAndLinks?.join("\n") ||
      "Not provided"
    }

The user can interact with this view by:
- Viewing dataset metadata and summary information
- Following the "View on OpenNeuro" link to view the dataset on openneuro.org
- Accessing technical details including file counts and size information
- Reading through authors, acknowledgements, and funding information`;

    const registration = {
      id: "OpenNeuroDatasetOverview",
      context,
      callbacks: [],
    };
    registerComponentForAI(registration);
    return () => unregisterComponentForAI("OpenNeuroDatasetOverview");
  }, [registerComponentForAI, unregisterComponentForAI, datasetInfo]);
};

export default useRegisterOpenNeuroDatasetOverviewAIComponent;
