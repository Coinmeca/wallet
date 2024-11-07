import { useTelegram } from "contexts/telegram";
import { useStorage } from "contexts/storage";
import { useWallet } from "@coinmeca/wallet-sdk/wallet";
import { useGuard } from "contexts/guard";
import { usePopupChecker } from "contexts/popup";
import { usePageLoader } from "./usePageLoader";

export { useTelegram, useStorage, useWallet, useGuard, usePopupChecker, usePageLoader };
