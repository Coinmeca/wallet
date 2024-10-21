import { Layouts } from "@coinmeca/ui/components";
import { Numberpad } from "@coinmeca/ui/containers/bottomsheets";
import { Parts } from "@coinmeca/ui/index";
import { Numberpads } from "@coinmeca/ui/parts";

export default function Lock() {
    return <>
        <Parts.Numberpad />
        test
    </>
    return <Layouts.Contents.SlideContainer
        contents={[
            {
                active: true,
                children: <Layouts.Col fill>
                    test
                    <Numberpad active={true} />
                </Layouts.Col>,
            }
        ]}
    />
}