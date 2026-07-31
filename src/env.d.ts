/// <reference types="vite/client" />
import "@tanstack/react-start";

declare module "@tanstack/router-core" {
  interface FilebaseRouteOptionsInterface {
    server?: any;
  }
}
