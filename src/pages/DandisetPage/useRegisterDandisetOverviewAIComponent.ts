import { useEffect } from "react";
import { useAIComponentRegistry } from "../../AIContext";
import { DandisetVersionInfo } from "../DandiPage/dandi-types";

const useRegisterDandisetOverviewAIComponent = ({
  dandisetVersionInfo,
  incomplete,
  numFilesLoaded,
}: {
  dandisetVersionInfo: DandisetVersionInfo;
  incomplete: boolean;
  numFilesLoaded: number;
}) => {
  const { registerComponentForAI, unregisterComponentForAI } =
    useAIComponentRegistry();
  useEffect(() => {
    const context = `
The user is viewing details about a DANDI dataset with the following information:

Name: ${dandisetVersionInfo.metadata.name}

Description: ${dandisetVersionInfo.metadata.description || "Not provided"}

Contributors: ${
      dandisetVersionInfo.metadata.contributor
        ?.map((c) => c.name)
        .join(" • ") || "Not provided"
    }

Dataset Information:
- ID: ${dandisetVersionInfo.dandiset.identifier}
- Version: ${dandisetVersionInfo.version}
- Created: ${new Date(dandisetVersionInfo.created).toLocaleDateString()}
- Status: ${dandisetVersionInfo.status}
- Total Size: ${dandisetVersionInfo.metadata.assetsSummary.numberOfBytes} bytes
- Total Files: ${dandisetVersionInfo.metadata.assetsSummary.numberOfFiles}
- Number of Subjects: ${dandisetVersionInfo.metadata.assetsSummary.numberOfSubjects}
- Files Currently Loaded: ${numFilesLoaded}${incomplete ? " (showing partial list)" : ""}

License: ${dandisetVersionInfo.metadata.license?.join(", ") || "Not provided"}

Citation: ${dandisetVersionInfo.metadata.citation || "Not provided"}

Keywords: ${dandisetVersionInfo.metadata.keywords?.join(", ") || "Not provided"}

Species: ${
      dandisetVersionInfo.metadata.assetsSummary.species
        ?.map((s) => s.name)
        .join(", ") || "Not provided"
    }

Research Methods:
- Approaches: ${
      dandisetVersionInfo.metadata.assetsSummary.approach
        ?.map((a) => a.name)
        .join(", ") || "Not provided"
    }
- Measurement Techniques: ${
      dandisetVersionInfo.metadata.assetsSummary.measurementTechnique
        ?.map((t) => t.name)
        .join(", ") || "Not provided"
    }

The user can interact with this view by:
- Clicking "Back to DANDI" to return to the DANDI archive
- Clicking "View on DANDI" to view this dataset on the DANDI archive website
- Expanding/collapsing long descriptions and contributor lists using "read more"/"show less" controls`;

    const registration = {
      id: "DandisetOverview",
      context,
      callbacks: [],
    };
    registerComponentForAI(registration);
    return () => unregisterComponentForAI("DandisetOverview");
  }, [
    registerComponentForAI,
    unregisterComponentForAI,
    dandisetVersionInfo,
    incomplete,
    numFilesLoaded,
  ]);
};

export default useRegisterDandisetOverviewAIComponent;
