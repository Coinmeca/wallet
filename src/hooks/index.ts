import { useTelegram } from "contexts/telegram";
import { useDiscord } from "contexts/discord";
import { useStorage } from "contexts/storage";
import { useGuard } from "contexts/guard";
import { useMessageHandler } from "contexts/message";
import { useOSNotification } from "contexts/os-notification";
import { usePageLoader } from "./usePageLoader";

export { useTelegram, useDiscord, useStorage, useGuard, useMessageHandler, usePageLoader, useOSNotification };
