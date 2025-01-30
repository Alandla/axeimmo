import { MediaBackground } from "./components/background";
import { BackgroundWithAvatar } from "./components/backgroundWithAvatar";
import { Transitions } from "./components/Transitions";


export const PreviewTransition = ({ data, transition }: { data: any, transition: any }) => {
	if (!data || !data.video.sequences.length || data.video.sequences.length === 0) {
        return <div>Loading...</div>;
    }

	return (
		<>
			{ data.video.avatar ? <BackgroundWithAvatar sequences={data.video.sequences} avatar={data.video.avatar} duration={data.video.metadata.audio_duration} /> : <MediaBackground sequences={data.video.sequences} transition={transition} /> }
			<Transitions transition={transition} />
		</>
	);
};
