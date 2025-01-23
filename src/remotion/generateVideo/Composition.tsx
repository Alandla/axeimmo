import { Audio } from 'remotion';
import { MediaBackground } from './components/background';
import { SubtitlesBold } from './subtitles/bold/subtitlesBold';
import { SubtitlesSimple } from './subtitles/simple/subtitlesSimple';
import { SubtitlesBackground } from './subtitles/background/subtitlesBackground';
import { SubtitlesClean } from './subtitles/clean/subtitlesClean';
import { BackgroundWithAvatar } from './components/backgroundWithAvatar';
import { Watermark } from './components/Watermark';
import { SubtitlesDaniel } from './subtitles/daniel/subtitlesDaniel';
import { SubtitlesModern } from './subtitles/modern/subtitlesModern';
import { Voices } from './components/Audios';

export const VideoGenerate = ({ data, showWatermark = true }: { data: any, showWatermark?: boolean }) => {
	if (!data || !data.video.sequences.length || data.video.sequences.length === 0) {
      return <div>Loading...</div>;
    }
	
	return (
		<>
			{ data.video.audio.url && <Audio src={data.video.audio.url} volume={data.video.audio.volume} /> }
			{ data.video.audio.voices && <Voices voices={data.video.audio.voices} volume={data.video.audio.volume} /> }
			{ data.video.audio.music && <Audio src={data.video.audio.music.url} volume={data.video.audio.music.volume} /> }
			{showWatermark && <Watermark />}
			{ data.video.avatar ? <BackgroundWithAvatar sequences={data.video.sequences} avatar={data.video.avatar} duration={data.video.metadata.audio_duration} /> : <MediaBackground sequences={data.video.sequences} /> }
			{ data.video.subtitle.style.template === 'bold' && <SubtitlesBold subtitleSequences={data.video.sequences} style={data.video.subtitle.style} /> }
			{ data.video.subtitle.style.template === 'simple' && <SubtitlesSimple subtitleSequences={data.video.sequences} style={data.video.subtitle.style} /> }
			{ data.video.subtitle.style.template === 'background' && <SubtitlesBackground subtitleSequences={data.video.sequences} style={data.video.subtitle.style} /> }
			{ data.video.subtitle.style.template === 'clean' && <SubtitlesClean subtitleSequences={data.video.sequences} style={data.video.subtitle.style} /> }
			{ data.video.subtitle.style.template === 'daniel' && <SubtitlesDaniel subtitleSequences={data.video.sequences} style={data.video.subtitle.style} /> }
			{ data.video.subtitle.style.template === 'modern' && <SubtitlesModern subtitleSequences={data.video.sequences} style={data.video.subtitle.style} /> }
		</>
	);
};
