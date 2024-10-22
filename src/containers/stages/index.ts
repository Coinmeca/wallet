import Create from "./create/Create";
import Import from "./import/Import";
import Init from "./init/Init";
import Welcome from "./welcome/Welcome";

import { Dispatch, SetStateAction } from "react";
interface Stage {
    stage: { name: string; level: number };
    setStage: Dispatch<SetStateAction<{
        name: string;
        level: number;
    }>>;
}

export { Create, Import, Init, Welcome, type Stage }