import { useEffect } from "react";
import { useAIComponentRegistry } from "../../AIContext";
import {
  AssetsResponseItem,
  DandisetVersionInfo,
} from "../DandiPage/dandi-types";

const useRegisterAIComponent = ({
  dandisetId,
  dandisetVersionInfo,
  allAssets,
  nwbFilesOnly,
  incomplete,
  nwbFilesOwnlyControlVisible,
}: {
  dandisetId: string | undefined;
  dandisetVersionInfo: DandisetVersionInfo | null;
  allAssets: AssetsResponseItem[] | null;
  nwbFilesOnly: boolean;
  incomplete: boolean;
  nwbFilesOwnlyControlVisible: boolean;
}) => {
  const { registerComponentForAI, unregisterComponentForAI } =
    useAIComponentRegistry();
  useEffect(() => {
    const context = `
The user is viewing the DandisetPage for dandiset ${dandisetId} version ${dandisetVersionInfo?.version}.
The dandiset has ${allAssets?.length || 0} files.
The dandiset has ${allAssets?.filter((a) => a.path.endsWith(".nwb")).length || 0} NWB files.
${nwbFilesOnly ? "The user is currently viewing only NWB files." : "The user is currently viewing all files."}
${incomplete ? "The list of files is incomplete." : ""}
The files visible are:
${allAssets
  ?.map((a) => `  ${a.path} (${a.size} bytes)`)
  .slice(0, 50)
  .join("\n")}

The user can interact with the page by:
- Clicking on a file to view it.
${nwbFilesOwnlyControlVisible ? "- Toggling the 'Show NWB files only' checkbox." : ""}
- Clicking on a file with the ".nwb" extension to view it in the NWB viewer.
`;
    const registration = {
      id: "DandisetPage",
      context,
      callbacks: [],
    };
    registerComponentForAI(registration);
    return () => unregisterComponentForAI("DandisetPage");
  }, [
    registerComponentForAI,
    unregisterComponentForAI,
    dandisetId,
    dandisetVersionInfo,
    allAssets,
    nwbFilesOnly,
    incomplete,
    nwbFilesOwnlyControlVisible,
  ]);
};

export default useRegisterAIComponent;
