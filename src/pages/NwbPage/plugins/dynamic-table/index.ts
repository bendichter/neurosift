import { getNwbGroup } from "@nwbInterface";
import { NwbObjectViewPlugin } from "../pluginInterface";
import DynamicTableView from "./DynamicTableView";

export const dynamicTablePlugin: NwbObjectViewPlugin = {
  name: "dynamic-table",
  canHandle: async ({ nwbUrl, path }: { nwbUrl: string; path: string }) => {
    const group = await getNwbGroup(nwbUrl, path);
    if (!group) return false;
    return group.attrs.colnames !== undefined;
  },
  component: DynamicTableView,
  showInMultiView: true,
};
