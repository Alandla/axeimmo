import { AbsoluteFill, Sequence, OffthreadVideo } from "remotion";

export const Watermark = () => {
	return (
		<Sequence from={0} durationInFrames={Infinity}>
			<AbsoluteFill>
				<OffthreadVideo
					src={"https://media.hoox.video/Logo%20Hoox%20Animation%20(2).webm"}
					transparent={true}
					style={{
						position: 'absolute',
						top: '50px',
						left: '50px',
						width: '19%',
						height: 'auto',
						opacity: 0.85,
						zIndex: 1000,
					}}
				/>
			</AbsoluteFill>
		</Sequence>
	);
};