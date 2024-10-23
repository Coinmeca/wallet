"use client";
import { Controls, Elements, Layouts } from "@coinmeca/ui/components";
import { format } from "@coinmeca/ui/lib/utils";

export default function Home() {
    return (
        <Layouts.Contents.InnerContent>
            <Layouts.Col align="center" style={{ height: '30vh', minHeight:'24em', maxHeight:'32em'}} fill>
                <Layouts.Col gap={2}>
                    <Elements.Text type={'h2'}>
                        {format(0.123,'currency', {
                            limit: 10,
                            unit: 12,
                            fix: 3,
                        })}
                    </Elements.Text>
                    <Elements.Text type={'h6'}>
                        ETH
                    </Elements.Text>
                </Layouts.Col>
            </Layouts.Col>
            <Layouts.Col fill>
                <Layouts.Box>
                    <Layouts.Col gap={0}>
                        <Layouts.Menu menu={[[
                            <>
                                <Controls.Tab>Token</Controls.Tab>
                            </>,
                            <>
                                <Controls.Tab>NFT</Controls.Tab>
                            </>,
                            <>
                                <Controls.Tab>Activity</Controls.Tab>
                            </>,
                        ]]} />
                    </Layouts.Col>
                
                    <div style={{ position: "fixed", width:'-webkit-fill-available', left:0, bottom: 0, margin:'2em' }}>
                        <Layouts.Row gap={2} fill>
                            <Controls.Button type={'solid'} icon={'chevron-left-bold'} color={'green'}>Receive</Controls.Button>
                            <Controls.Button type={'solid'} icon={'chevron-right-bold'} color={'red'}>Send</Controls.Button>
                        </Layouts.Row>
                    </div>
                </Layouts.Box>
            </Layouts.Col>
        </Layouts.Contents.InnerContent>
    );
}
