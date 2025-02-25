import { DatasetFile } from "../common/DatasetWorkspace/plugins/pluginInterface";

export interface OpenNeuroDatasetInfo {
  id: string;
  created: string;
  snapshot: {
    id: string;
    tag: string;
    created: string;
    size: number;
    description: {
      Name: string;
      Authors: string[];
      DatasetDOI?: string;
      License?: string;
      Acknowledgements?: string;
      Funding?: string;
      ReferencesAndLinks?: string[];
    };
    files: DatasetFile[];
    summary: {
      modalities: string[];
      sessions: string[];
      subjects: string[];
      totalFiles: number;
    };
    analytics: {
      downloads: number;
      views: number;
    };
  };
}
