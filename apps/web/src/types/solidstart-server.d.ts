declare module "@solidjs/start/server" {
  import type { JSX } from "solid-js";

  export interface StartServerProps {
    document?: (params: {
      assets: JSX.Element;
      children: JSX.Element;
      scripts: JSX.Element;
    }) => JSX.Element;
  }

  export function StartServer(props: StartServerProps): JSX.Element;

  export function createHandler(
    handler: () => JSX.Element | Promise<JSX.Element>,
  ): (event: unknown) => Response | Promise<Response>;
}
