'use client';

import { Elements, Layouts } from "@coinmeca/ui/components";
import { Parts } from "@coinmeca/ui/index";
import { useState } from "react";

export default function Lock() {
    const length = 6;
    const [passcode, setPasscode] = useState('');
    const [error, setError] = useState(false);
    const handlePasscodeClick = (v: string) => {
        if (v?.length > length) return;
        else if (v?.length === length) {
            setError(true);
            console.log('verify');
        } else {
            setError(false);
            console.log('remove');
        }
        console.log(v);
        setPasscode(v);
    }

    return <Layouts.Contents.SlideContainer
        contents={[
            {
                active: true,
                children: <Layouts.Col align={'center'} fill>
                    <Elements.Passcode index={passcode.length} length={length} error={error} gap={'5%'} />
                </Layouts.Col>,
            },
            {
                active: true,
                children: <Layouts.Col fill>
                    <Parts.Numberpad type="code" value={passcode} onChange={(e: any, v: any) => handlePasscodeClick(v)} style={{background:'rgba(var(--black),.45)'}} />
                </Layouts.Col>,
            }
        ]}
        vertical={true}
    />
}