import { SmallIconButton } from "@fi-sci/misc";
import { Cancel, Send } from "@mui/icons-material";
import Markdown from "app/Markdown/Markdown";
import {
  ORFunctionDescription,
  ORMessage,
  ORTool,
} from "app/pages/DandisetPage/DandisetViewFromDendro/openRouterTypes";
import useRoute from "app/useRoute";
import {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import chatCompletion from "./chatCompletion";
import helperAssistants from "./helperAssistants";
import {
  computeEmbeddingForAbstractText,
  findSimilarDandisetIds,
  loadEmbeddings,
} from "../DandisetPage/DandisetViewFromDendro/SimilarDandisetsView";
import {
  fetchNeurodataTypesIndex,
  NeurodataTypesIndex,
} from "../DandiQueryPage/SearchByNeurodataTypeWindow";
import { neurodataTypesTool } from "./probeNeurodataTypes";
import { unitsColnamesTool } from "./probeUnitsColnames";
import { dandisetObjectsTool } from "./probeDandisetObjects";

export type Chat = {
  messages: (ORMessage | { role: "client-side-only"; content: string })[];
};

export const emptyChat: Chat = {
  messages: [],
};

type ChatWindowProps = {
  width: number;
  height: number;
  chat: Chat;
  setChat: (chat: Chat) => void;
  openRouterKey: string | null;
  onLogMessage: (title: string, message: string) => void;
  additionalKnowledge: string;
};

type PendingMessages = (
  | ORMessage
  | { role: "client-side-only"; content: string }
)[];

type PendingMessagesAction =
  | {
      type: "add";
      message: ORMessage | { role: "client-side-only"; content: string };
    }
  | {
      type: "clear";
    }
  | {
      type: "replace-last";
      message: ORMessage | { role: "client-side-only"; content: string };
    };

const pendingMesagesReducer = (
  state: PendingMessages,
  action: PendingMessagesAction,
): PendingMessages => {
  if (action.type === "add") {
    return [...state, action.message];
  } else if (action.type === "clear") {
    return [];
  } else if (action.type === "replace-last") {
    if (state.length === 0) {
      return state;
    }
    return [...state.slice(0, state.length - 1), action.message];
  } else {
    return state;
  }
};

export type ToolItem = {
  function: (
    args: any,
    onLogMessage: (title: string, message: string) => void,
  ) => Promise<any>;
  detailedDescription?: string;
  tool: ORTool;
};

const ChatWindow: FunctionComponent<ChatWindowProps> = ({
  width,
  height,
  chat,
  setChat,
  openRouterKey,
  onLogMessage,
  additionalKnowledge,
}) => {
  const { route, setRoute } = useRoute();
  const inputBarHeight = 30;
  const settingsBarHeight = 20;
  const topBarHeight = 24;

  const [modelName, setModelName] = useState("openai/gpt-4o");

  const handleUserMessage = useCallback(
    (message: string) => {
      setChat({
        messages: [...chat.messages, { role: "user", content: message }],
      });
    },
    [chat, setChat],
  );

  const messages = chat.messages;

  const [pendingMessages, pendingMessagesDispatch] = useReducer(
    pendingMesagesReducer,
    [],
  );

  const lastMessage = useMemo(() => {
    const messages2: ORMessage[] = [
      ...messages.filter((x) => x.role !== "client-side-only"),
    ];
    if (messages2.length === 0) return null;
    return messages2[messages2.length - 1];
  }, [messages]);

  const lastMessageIsUserOrTool = useMemo(() => {
    return lastMessage
      ? lastMessage.role === "user" || lastMessage.role === "tool"
      : false;
  }, [lastMessage]);

  const lastMessageIsToolCalls = useMemo(() => {
    return lastMessage
      ? !!(
          lastMessage.role === "assistant" &&
          lastMessage.content === null &&
          lastMessage.tool_calls
        )
      : false;
  }, [lastMessage]);

  const tools: ToolItem[] = useMemo(() => {
    const assistantTools = helperAssistants.map((helper) => {
      const functionDescription: ORFunctionDescription = {
        description: helper.description,
        name: helper.name,
        parameters: {
          type: "object",
          properties: helper.parameters,
        },
      };
      return {
        function: async (
          args: { prompt: string },
          onLogMessage: (title: string, message: string) => void,
        ) => {
          const helperQueryNumber = globalHelperQueryNumber++;
          onLogMessage(
            `${helper.name} query ${helperQueryNumber}`,
            JSON.stringify(args),
          );
          const resp = await helper.inquire(args, {
            openRouterKey,
            modelName,
          });
          onLogMessage(`${helper.name} response ${helperQueryNumber}`, resp);
          return resp;
        },
        tool: {
          type: "function" as any,
          function: functionDescription,
        },
      };
    });
    return [
      ...assistantTools,
      relevantDandisetsTool,
      relevantDandisetsTool,
      neurodataTypesTool,
      unitsColnamesTool,
      dandisetObjectsTool,
      // consultTool
    ];
  }, [modelName, openRouterKey]);

  const systemMessage = useSystemMessage(tools, additionalKnowledge);

  useEffect(() => {
    if (!systemMessage) return;
    // submit user message or tool results
    let canceled = false;
    const messages2: ORMessage[] = [
      {
        role: "system",
        content: systemMessage,
      },
      ...messages.filter((x) => x.role !== "client-side-only"),
    ];
    const lastMessage = messages2[messages2.length - 1];
    if (!lastMessage) return;
    if (lastMessage.role === "user" || lastMessage.role === "tool") {
      (async () => {
        const { assistantMessage, toolCalls } = await chatCompletion({
          messages: messages2,
          modelName,
          openRouterKey,
          tools: tools.map((x) => x.tool),
        });
        if (canceled) return;
        if (!toolCalls) {
          setChat({
            messages: [
              ...messages,
              { role: "assistant", content: assistantMessage },
            ],
          });
        } else {
          // tool calls
          if (assistantMessage) {
            console.warn(
              "Unexpected: assistant message and tool calls. Ignoring assistant message.",
            );
          }
          const newMessages: (
            | ORMessage
            | { role: "client-side-only"; content: string }
          )[] = [];
          const msg: ORMessage = {
            role: "assistant",
            content: null,
            tool_calls: toolCalls,
          };
          newMessages.push(msg);
          pendingMessagesDispatch({
            type: "add",
            message: msg,
          });
          // todo: do the tool calls here, instead of below, accumulate pending messages, and then set them all at once
          const processToolCall = async (tc: any) => {
            const func = tools.find(
              (x) => x.tool.function.name === tc.function.name,
            )?.function;
            if (!func) {
              throw Error(`Unexpected. Did not find tool: ${tc.function.name}`);
            }
            const msg0: { role: "client-side-only"; content: string } = {
              role: "client-side-only",
              content: "calling " + labelForToolCall(tc) + "...",
            };
            newMessages.push(msg0);
            pendingMessagesDispatch({
              type: "add",
              message: msg0,
            });
            const args = JSON.parse(tc.function.arguments);
            console.info("TOOL CALL: ", tc.function.name, args);
            let response: string;
            try {
              response = await func(args, onLogMessage);
            } catch (e: any) {
              response = "Error: " + e.message;
            }
            if (canceled) return;
            msg0.content = "called " + labelForToolCall(tc);
            pendingMessagesDispatch({
              type: "replace-last",
              message: msg0,
            });
            console.info("TOOL RESPONSE: ", response);
            const msg1: ORMessage = {
              role: "tool",
              content: JSON.stringify(response),
              tool_call_id: tc.id,
            };
            newMessages.push(msg1);
            pendingMessagesDispatch({
              type: "add",
              message: msg1,
            });
          };
          // run the tool calls in parallel
          await Promise.all(toolCalls.map(processToolCall));
          setChat({
            messages: [...messages, ...newMessages],
          });
          pendingMessagesDispatch({
            type: "clear",
          });
        }
      })();
    }
    return () => {
      canceled = true;
    };
  }, [
    messages,
    modelName,
    route,
    setChat,
    openRouterKey,
    tools,
    onLogMessage,
    systemMessage,
  ]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleClearAllMessages = useCallback(() => {
    setChat({
      messages: [],
    });
  }, [setChat]);

  const handleSpecialLinkClick = useCallback(
    (link: string) => {
      console.info("Special link clicked:", link);
      if (link.startsWith("?")) {
        const parts = link.slice(1).split("&");
        const params: { [key: string]: string } = {};
        for (const part of parts) {
          const vv = part.split("=");
          if (vv.length === 2) {
            params[vv[0]] = vv[1];
          }
        }
        if (params.page === "dandiset" && params.dandisetId) {
          setRoute({ page: "dandiset", dandisetId: params.dandisetId });
        }
      }
    },
    [setRoute],
  );

  const initialMessage = useMemo(() => {
    return `
  I can help you find information about Dandisets in the DANDI Archive. You can ask me about specific Dandisets, or I can help you locate relevant Dandisets based on a topic or query you're interested in. If you have a specific question or need information about a Dandiset, feel free to ask!
  `;
  }, []);

  const inputBarEnabled = useMemo(() => {
    return !lastMessageIsUserOrTool && !lastMessageIsToolCalls;
  }, [lastMessageIsUserOrTool, lastMessageIsToolCalls]);

  const suggestedQuestions = useMemo(() => {
    return ["What questions can I ask?"];
  }, []);

  const handleClickSuggestedQuestion = useCallback(
    (question: string) => {
      if (!inputBarEnabled) {
        return;
      }
      setChat({
        messages: [...messages, { role: "user", content: question }],
      });
    },
    [messages, setChat, inputBarEnabled],
  );

  return (
    <div style={{ position: "relative", width, height }}>
      <div
        ref={chatContainerRef}
        style={{
          position: "absolute",
          left: 5,
          width: width - 10,
          top: topBarHeight,
          height: height - topBarHeight - inputBarHeight - settingsBarHeight,
          overflow: "auto",
        }}
      >
        <div>
          <Markdown source={initialMessage} />
        </div>
        {suggestedQuestions.length > 0 && (
          <div style={{ marginTop: 5, marginBottom: 5 }}>
            {suggestedQuestions.map((question, index) => (
              <span key={index}>
                {index > 0 && <br />}
                <span
                  style={{
                    marginLeft: 5,
                    marginRight: 5,
                    cursor: inputBarEnabled ? "pointer" : undefined,
                    color: inputBarEnabled ? "#aaf" : "lightgray",
                  }}
                  onClick={() => handleClickSuggestedQuestion(question)}
                >
                  {question}
                </span>
              </span>
            ))}
          </div>
        )}
        {[...messages, ...pendingMessages]
          .filter((m) => {
            if (m.role === "tool") {
              return false;
            }
            if (m.role === "assistant" && m.content === null) {
              return false;
            }
            return true;
          })
          .map((c, index) => (
            <div
              key={index}
              ref={index === messages.length - 1 ? lastMessageRef : null}
              style={{
                color: colorForString(c.role),
              }}
            >
              <hr />
              {c.role === "assistant" && c.content !== null ? (
                <>
                  <Markdown
                    source={c.content as string}
                    onSpecialLinkClick={handleSpecialLinkClick}
                  />
                </>
              ) : c.role === "user" ? (
                <>
                  <span>you: </span>
                  <span style={{ color: "black" }}>
                    <MessageDisplay message={c.content as string} />
                  </span>
                </>
              ) : c.role === "client-side-only" ? (
                <>
                  <span style={{ color: "#6a6" }}>{c.content}</span>
                </>
              ) : (
                <span>Unknown role: {c.role}</span>
              )}
            </div>
          ))}
        {lastMessageIsUserOrTool || lastMessageIsToolCalls ? (
          <div>
            <hr />
            <span style={{ color: "#6a6" }}>...</span>
          </div>
        ) : null}
      </div>
      <div
        style={{
          position: "absolute",
          width,
          height: inputBarHeight,
          top: height - inputBarHeight - settingsBarHeight,
          left: 0,
        }}
      >
        <InputBar
          width={width}
          height={inputBarHeight}
          onMessage={handleUserMessage}
          disabled={!inputBarEnabled}
          waitingForResponse={lastMessageIsUserOrTool || lastMessageIsToolCalls}
        />
      </div>
      <div
        style={{
          position: "absolute",
          width,
          height: settingsBarHeight,
          top: height - settingsBarHeight,
          left: 0,
        }}
      >
        <SettingsBar
          width={width}
          height={settingsBarHeight}
          onClearAllMessages={handleClearAllMessages}
          modelName={modelName}
          setModelName={setModelName}
        />
      </div>
    </div>
  );
};

type InputBarProps = {
  width: number;
  height: number;
  onMessage: (message: string) => void;
  disabled?: boolean;
  waitingForResponse?: boolean;
};

const InputBar: FunctionComponent<InputBarProps> = ({
  width,
  height,
  onMessage,
  disabled,
  waitingForResponse,
}) => {
  const [messageText, setMessageText] = useState("");
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === "NumpadEnter" || e.key === "Return") {
        // not sure about this
        if (messageText.length > 1000) {
          alert("Message is too long");
          return;
        }
        onMessage(messageText);
        setMessageText("");
      }
    },
    [messageText, onMessage],
  );
  return (
    <div style={{ position: "absolute", width, height }}>
      <input
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        style={{ width: width - 8 - 20, height: height - 7 }}
        onKeyDown={handleKeyDown}
        placeholder={
          waitingForResponse ? "Waiting for response..." : "Type a message..."
        }
        disabled={disabled}
      />
      <span style={{ position: "relative", top: "-5px" }}>
        <SmallIconButton
          icon={<Send />}
          title="Submit"
          onClick={() => {
            if (messageText.length > 1000) {
              alert("Message is too long");
              return;
            }
            onMessage(messageText);
            setMessageText("");
          }}
        />
      </span>
    </div>
  );
};

type SettingsBarProps = {
  width: number;
  height: number;
  onClearAllMessages: () => void;
  modelName: string;
  setModelName: (name: string) => void;
};

const modelOptions = [
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "anthropic/claude-3.5-sonnet",
  "anthropic/claude-3-haiku",
  // 'google/gemini-flash-1.5',
  // 'google/gemini-pro-1.5'
];

const SettingsBar: FunctionComponent<SettingsBarProps> = ({
  onClearAllMessages,
  modelName,
  setModelName,
}) => {
  return (
    <span style={{ fontSize: 12, padding: 5 }}>
      &nbsp;
      <select value={modelName} onChange={(e) => setModelName(e.target.value)}>
        {modelOptions.map((x) => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </select>
      &nbsp;
      <SmallIconButton
        icon={<Cancel />}
        onClick={() => {
          onClearAllMessages();
        }}
        title="Clear all messages"
      />
      <span>&nbsp;AI can be inaccurate.</span>
    </span>
  );
};

const colorForString = (s: string) => {
  // s is a random user ID, we need to derive a color from it
  // This is a simple way to do it
  const hash = s.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const r = hash % 200;
  const g = (hash * 2) % 200;
  const b = (hash * 3) % 200;
  return `rgb(${r},${g},${b})`;
};

type MessageDisplayProps = {
  message: string;
};

const MessageDisplay: FunctionComponent<MessageDisplayProps> = ({
  message,
}) => {
  // turn URLs into hyperlinks
  const parts = message.split(" ");
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 ? " " : ""}
          {part.startsWith("http://") || part.startsWith("https://") ? (
            <a href={part} target="_blank" rel="noreferrer">
              {part}
            </a>
          ) : (
            part
          )}
        </span>
      ))}
    </>
  );
};

const labelForToolCall = (tc: {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}) => {
  const functionName = tc.function.name;
  if (functionName === "load_external_resource") {
    const args = JSON.parse(tc.function.arguments);
    const arg = args.url || "";
    return `load_external_resource ${arg}`;
  } else {
    return tc.function.name;
  }
};

const getSystemMessage = async (
  tools: ToolItem[],
  additionalKnowledge: string,
) => {
  let allNeurodataTypes: string[];
  try {
    allNeurodataTypes = await getAllNeurodataTypes();
  } catch (e) {
    console.warn("Failed to get all neurodata types", e);
    allNeurodataTypes = [];
  }

  let systemMessage = `
You are a helpful assistant that is responding to questions about the DANDI Archive.

You should make use of the tools provided to you to help answer questions.

If the questions are irrelevant or inappropriate, you should respond with a message indicating that you are unable to help with that question.

Whenever you provide a 6-digit Dandiset ID in response to a question you should use markdown notation for a link of the following format

[000409](https://dandiarchive.org/dandiset/000409)

where of course the number 000409 is replaced with the actual Dandiset ID.

Within one response, do not make excessive calls to the tools. Maybe up to around 5 is reasonable. But if you want to make more, you could ask the user if they would like you to do more work to find the answer.

Assume that if the user is asking to find Dandisets, they also want to know more about those dandisets and how they are relevant to the user's query.

If the user is looking for particular types of data, you will want to probe the neurodata types in DANDI by submitting scripts
to the probe_neurodata_types tool.
The possible neurodata types are: ${allNeurodataTypes.join(", ")}.

If the user wants dandisets with particular data type and also other criteria (like a prompt),
then you should first find the dandisets with the data types using the probe_neurodata_types tool,
and then use the relevant_dandisets tool with a restriction to the dandisets found in the previous step.

If the user wants to know about what column names are in units tables for various dandisets, you can use the probe_units_colnames tool.

When you refer to a particular neurodata object (that is in an NWB file within a dandiset), you should use the following link to a visualization

[label](?action=view_item&dandiset=[dandiset_id]&file_path=[file_path]&object_path=[object_path]&neurodata_type=[neurodata_type])

${additionalKnowledge}

  `;
  for (const tool of tools) {
    if (tool.detailedDescription) {
      systemMessage += `
========================
Here's a detailed description of the ${tool.tool.function.name} tool:
${tool.detailedDescription}
========================
`;
    }
  }

  // But before you do anything you should use the consult tool one or more times to get information about the topics that the user is asking about.
  // This will help you to understand the context of the user's query and to provide more relevant responses.
  // The possible topics are:
  // - units-tables: This corresponds to the Units neurodata type and contains neural spiking data - usually the output of spike sorting.
  // - behavioral-events: This corresponds to the BehavioralEvents neurodata type and contains data about behavioral events.
  // - optical-physiology: This corresponds to the OpticalPhysiology neurodata type and contains data about optical physiology experiments.

  return systemMessage;
};

const useSystemMessage = (tools: ToolItem[], additionalKnowledge: string) => {
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  useEffect(() => {
    getSystemMessage(tools, additionalKnowledge).then((msg) => {
      setSystemMessage(msg);
    });
  }, [tools, additionalKnowledge]);
  return systemMessage;
};

let globalHelperQueryNumber = 1;

const relevantDandisetsTool = {
  tool: {
    type: "function" as any,
    function: {
      name: "relevant_dandisets",
      description:
        "Returns a list of 6-digit Dandiset IDs most relevant to a given prompts, in descending order of relevance.",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "The prompt to use to find relevant Dandisets.",
          },
          restrict_to_dandisets: {
            type: "string",
            description:
              "An optional comma-separated list of 6-digit Dandiset IDs to restrict the search to.",
          },
        },
      },
    },
  },
  function: async (
    args: { prompt: string; restrict_to_dandisets: string | null },
    onLogMessage: (title: string, message: string) => void,
  ) => {
    const { prompt, restrict_to_dandisets } = args;
    const embeddings = await loadEmbeddings();
    if (embeddings === null || embeddings === undefined) {
      throw new Error("Problem loading embeddings");
    }
    const modelName = "text-embedding-3-large";
    onLogMessage(
      "relevant_dandisets query",
      prompt + " " + restrict_to_dandisets,
    );
    const embedding = await computeEmbeddingForAbstractText(prompt, modelName);
    let dandisetIds = findSimilarDandisetIds(embeddings, embedding, modelName);
    if (restrict_to_dandisets) {
      const restrictToDandisetsSet = new Set(
        restrict_to_dandisets.split(",").map((x) => x.trim()),
      );
      dandisetIds = dandisetIds.filter((id) => restrictToDandisetsSet.has(id));
    }
    dandisetIds = dandisetIds.slice(0, 20);
    onLogMessage("relevant_dandisets response", dandisetIds.join(", "));
    return dandisetIds.join(", ");
  },
};

const getAllNeurodataTypes = async () => {
  const a: any = await fetchNeurodataTypesIndex();
  if (!a) {
    throw new Error("Failed to fetch neurodata types index");
  }
  return a.neurodata_types.map((x: any) => x.neurodata_type);
};

// const topicInfo: { [key: string]: string } = {
//   "units-tables": "Units tables are the boss",
//   "behavioral-events": "Behavioral events are the boss",
//   "optical-physiology": "Optical physiology is the boss",
// };

// const consultTool = {
//   tool: {
//     type: "function" as any,
//     function: {
//       name: "consult",
//       description:
//         "Consult documentation on a topic. The possible topics are: units-tables, behavioral-events, and optical-physiology.",
//       parameters: {
//         type: "object",
//         properties: {
//           topic: {
//             type: "string",
//             description:
//               "The topic to consult. See description for possible values.",
//           },
//         },
//       },
//     },
//   },
//   function: async (
//     args: { topic: string },
//     onLogMessage: (title: string, message: string) => void,
//   ) => {
//     const { topic } = args;
//     onLogMessage("consult query", topic);
//     const ret =
//       topicInfo[topic] || "No information found for the specified topic.";
//     onLogMessage("consult response", ret);
//     return ret;
//   },
// };

export default ChatWindow;
