import Create from "./create/Create";
import Import from "./import/Import";
import Init from "./init/Init";
import Welcome from "./welcome/Welcome";
import Lock from "./lock/Lock";
import Contact from "./contact/Contact";
import Tx from "./tx/Tx";
import * as Input from "./input";

import type { Dispatch, SetStateAction } from "react";
interface Stage {
    stage: { name: string; level: number };
    setStage: Dispatch<
        SetStateAction<{
            name: string;
            level: number;
        }>
    >;
}

export { type Stage, Create, Import, Init, Welcome, Lock, Input, Contact, Tx };
