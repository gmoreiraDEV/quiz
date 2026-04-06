declare module "@typebot.io/react" {
  import type { CSSProperties, JSX } from "react";

  export type TypebotPrefilledVariables = Record<
    string,
    string | number | boolean
  >;

  export type TypebotCommandOptions = {
    id?: string;
  };

  export type TypebotTheme = Record<string, unknown>;

  export type TypebotAnswerEvent = {
    blockId: string;
    message: string;
  };

  export type StandardProps = {
    id?: string;
    apiHost?: string;
    className?: string;
    onAnswer?: (payload: TypebotAnswerEvent) => void;
    onChatStatePersisted?: (
      isEnabled: boolean,
      payload: { typebotId: string },
    ) => void;
    onEnd?: () => void;
    onScriptExecutionSuccess?: (blockId: string) => void;
    prefilledVariables?: TypebotPrefilledVariables;
    style?: CSSProperties;
    theme?: TypebotTheme;
    typebot: string;
  };

  export function Standard(props: StandardProps): JSX.Element;

  export function setPrefilledVariables(
    variables: TypebotPrefilledVariables,
    options?: TypebotCommandOptions,
  ): void;
}
