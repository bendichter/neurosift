import { useEffect, useReducer } from "react";
import { useAIComponentRegistry } from "../../AIContext";
import { NwbFileOverview } from "./types";
import { valueToString2 } from "./DatasetDataView";
import { getHdf5DatasetData } from "@hdf5Interface";

const datasetValuesReducer = (
  state: Record<string, string>,
  action: { type: "set"; path: string; value: string },
) => {
  return { ...state, [action.path]: action.value };
};

const useRegisterNwbAIComponent = ({
  nwbUrl,
  dandisetId,
  dandisetVersion,
  nwbFileOverview,
}: {
  nwbUrl: string;
  dandisetId?: string;
  dandisetVersion: string;
  nwbFileOverview: NwbFileOverview | null;
}) => {
  const { registerComponentForAI, unregisterComponentForAI } =
    useAIComponentRegistry();

  const [datasetValues, datasetValuesDispatch] = useReducer(
    datasetValuesReducer,
    {},
  );
  useEffect(() => {
    if (!nwbFileOverview) return;
    const loadDatasetValues = async () => {
      for (const item of nwbFileOverview.items) {
        try {
          const data = await getHdf5DatasetData(nwbUrl, item.path, {});
          const val = valueToString2(data);
          datasetValuesDispatch({ type: "set", path: item.path, value: val });
        } catch (err) {
          console.warn(err);
        }
      }
    };
    loadDatasetValues();
  }, [nwbFileOverview, nwbUrl]);

  useEffect(() => {
    // Type guard to check if the overview has an error
    const isErrorResponse = (obj: unknown): obj is { error: string } => {
      return (
        obj !== null &&
        typeof obj === "object" &&
        "error" in obj &&
        typeof (obj as { error: unknown }).error === "string"
      );
    };

    const overview =
      nwbFileOverview && !isErrorResponse(nwbFileOverview)
        ? nwbFileOverview
        : null;
    const errorMessage =
      nwbFileOverview && isErrorResponse(nwbFileOverview)
        ? nwbFileOverview.error
        : null;

    const context = `
The user is viewing an NWB file in the NwbPage.
URL: ${nwbUrl}
${dandisetId ? `This file is from DANDI dataset ${dandisetId} version ${dandisetVersion}` : ""}
${overview ? `NWB Version: ${overview.nwbVersion}` : ""}

${
  overview
    ? `File contents overview:
${overview.items.map((item) => `- ${item.name}: ${datasetValues[item.path]}`).join("\n")}`
    : ""
}

${errorMessage ? `Error loading file: ${errorMessage}` : ""}

The user can interact with the page by:
- Exploring the NWB file hierarchy
- Clicking to open neurodata objects
`;

    const registration = {
      id: "NwbPage",
      context,
      callbacks: [],
    };
    registerComponentForAI(registration);
    return () => unregisterComponentForAI("NwbPage");
  }, [
    registerComponentForAI,
    unregisterComponentForAI,
    nwbUrl,
    dandisetId,
    dandisetVersion,
    nwbFileOverview,
    datasetValues,
  ]);
};

export default useRegisterNwbAIComponent;
