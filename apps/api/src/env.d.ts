/// <reference types="vite/client" />

declare module "*.graphql" {
    const content: string;
    export default content;
}
