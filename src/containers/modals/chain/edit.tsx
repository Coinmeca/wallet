"use client";

import { useCallback, useMemo, useState } from "react";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { Modal } from "@coinmeca/ui/containers";
import { CoinmecaWalletContextProvider, useCoinmecaWalletProvider } from "@coinmeca/wallet-provider/provider";
import { dehydrate, HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "api";
import { short } from "utils";

export interface Edit {
    onClose: Function;
    close?: boolean;
}

export default function Edit(props: Edit) {
    const client = getQueryClient();

    return (
        <CoinmecaWalletContextProvider>
            <QueryClientProvider {...{ client }}>
                <HydrationBoundary state={dehydrate(client)}>
                    <ChainEditModal {...props} />
                </HydrationBoundary>
            </QueryClientProvider>
        </CoinmecaWalletContextProvider>
    );
}

const ChainEditModal = (props: any) => {
    const { provider } = useCoinmecaWalletProvider();

    const [name, setName] = useState<string>();
    const [error, setError] = useState<any>();
    const [init, setInit] = useState<any>(false);

    const handleClose = (e: any) => {
        props?.onClose(e);
    };

    return (
        <Modal {...props} title={"Manage approvals"} onClose={handleClose} close>
            <Layouts.Col gap={2}>
                {/* <Layouts.List list={accounts} formatter={acocuntList} /> */}
                {/* <Layouts.Row> */}
                {/* <Controls.Button onClick={handleClose}>Cancel</Controls.Button> */}
                {/* <Controls.Button onClick={handleSave}>Save</Controls.Button> */}
                {/* </Layouts.Row> */}
            </Layouts.Col>
        </Modal>
    );
};
