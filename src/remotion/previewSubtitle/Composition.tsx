
import { SubtitlesBackground } from "./subtitles/background/subtitlesBackground";
import { SubtitlesBold } from "./subtitles/bold/subtitlesBold";
import { SubtitlesClean } from "./subtitles/clean/subtitlesClean";
import { SubtitlesDaniel } from "./subtitles/daniel/subtitlesDaniel";
import { SubtitlesModern } from "./subtitles/modern/subtitlesModern";
import { SubtitlesSimple } from "./subtitles/simple/subtitlesSimple";


export const PreviewSubtitle = ({ data, subtitle }: { data: any, subtitle: any }) => {
	if (!data || !data.video.sequences.length || data.video.sequences.length === 0) {
        return <div>Loading...</div>;
    }

	return (
		<>
			{ subtitle.style.template === 'bold' && <SubtitlesBold subtitleSequences={data.video.sequences} style={subtitle.style} /> }
			{ subtitle.style.template === 'simple' && <SubtitlesSimple subtitleSequences={data.video.sequences} style={subtitle.style} /> }
			{ subtitle.style.template === 'clean' && <SubtitlesClean subtitleSequences={data.video.sequences} style={subtitle.style} /> }
			{ subtitle.style.template === 'background' && <SubtitlesBackground subtitleSequences={data.video.sequences} style={subtitle.style} /> }
			{ subtitle.style.template === 'modern' && <SubtitlesModern subtitleSequences={data.video.sequences} style={subtitle.style} /> }
			{ subtitle.style.template === 'daniel' && <SubtitlesDaniel subtitleSequences={data.video.sequences} style={subtitle.style} /> }
		</>
	);
};
