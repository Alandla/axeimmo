
import { SubtitlesBold } from "./subtitles/bold/subtitlesBold";
import { SubtitlesSimple } from "./subtitles/simple/subtitlesSimple";


export const PreviewSubtitle = ({ data, subtitle }: { data: any, subtitle: any }) => {
	if (!data || !data.video.sequences.length || data.video.sequences.length === 0) {
        return <div>Loading...</div>;
    }

	return (
		<>
			{ subtitle.style.template === 'bold' && <SubtitlesBold subtitleSequences={data.video.sequences} style={subtitle.style} /> }
			{ subtitle.style.template === 'simple' && <SubtitlesSimple subtitleSequences={data.video.sequences} style={subtitle.style} /> }
		</>
	);
};
