"use client";

import { TypedDataPage } from "../eth_signTypedData/typed-data-page";

export default function Page() {
    return <TypedDataPage method={"eth_signTypedData_v4"} sign={(provider, data, signer, app) => provider?.signTypedData_v4(data, signer, app)} />;
}
