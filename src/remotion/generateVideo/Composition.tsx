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
import { Transitions } from './components/Transitions';

export const VideoGenerate = ({ 
	data, 
	showWatermark = true,
	onSubtitleStyleChange,
	onAvatarHeightRatioChange,
	onAvatarPositionChange,
	onMediaPositionChange
}: { 
	data: any, 
	showWatermark?: boolean,
	onSubtitleStyleChange?: (newStyle: any) => void,
	onAvatarHeightRatioChange?: (ratio: number) => void,
	onAvatarPositionChange?: (position: { x: number, y: number }) => void,
	onMediaPositionChange?: (sequenceId: number, position: { x: number, y: number }) => void
}) => {
	if (!data || !data.video.sequences.length || data.video.sequences.length === 0) {
      return <div>Loading...</div>;
    }
	
	return (
		<>
			{ data.video.audio.url && <Audio src={data.video.audio.url} volume={data.video.audio.volume} /> }
			{ data.video.audio.voices && <Voices voices={data.video.audio.voices} volume={data.video.audio.volume} /> }
			{ data.video.audio.music && <Audio src={data.video.audio.music.url} volume={data.video.audio.music.volume} /> }
			{showWatermark && <Watermark />}
			{ data.video.avatar ? <BackgroundWithAvatar 
				sequences={data.video.sequences} 
				avatar={data.video.avatar} 
				duration={data.video.metadata.audio_duration} 
				avatarHeightRatio={data.settings?.avatarHeightRatio}
				onAvatarHeightRatioChange={onAvatarHeightRatioChange} 
				onAvatarPositionChange={onAvatarPositionChange}
				onMediaPositionChange={onMediaPositionChange}
			/> : <MediaBackground sequences={data.video.sequences} onMediaPositionChange={onMediaPositionChange} /> }
			{ data.video.transitions && <Transitions sequences={data.video.sequences} transitions={data.video.transitions} /> }
			{ data.video.subtitle.style.template === 'bold' && <SubtitlesBold subtitleSequences={data.video.sequences} style={data.video.subtitle.style} onStyleChange={onSubtitleStyleChange} /> }
			{ data.video.subtitle.style.template === 'simple' && <SubtitlesSimple subtitleSequences={data.video.sequences} style={data.video.subtitle.style} onStyleChange={onSubtitleStyleChange} /> }
			{ data.video.subtitle.style.template === 'background' && <SubtitlesBackground subtitleSequences={data.video.sequences} style={data.video.subtitle.style} onStyleChange={onSubtitleStyleChange} /> }
			{ data.video.subtitle.style.template === 'clean' && <SubtitlesClean subtitleSequences={data.video.sequences} style={data.video.subtitle.style} onStyleChange={onSubtitleStyleChange} /> }
			{ data.video.subtitle.style.template === 'daniel' && <SubtitlesDaniel subtitleSequences={data.video.sequences} style={data.video.subtitle.style} onStyleChange={onSubtitleStyleChange} /> }
			{ data.video.subtitle.style.template === 'modern' && <SubtitlesModern subtitleSequences={data.video.sequences} style={data.video.subtitle.style} onStyleChange={onSubtitleStyleChange} /> }
		</>
	);
};
