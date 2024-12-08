
import { AbsoluteFill, Img, OffthreadVideo, staticFile } from "remotion";

export const Watermark = () => {
 
	return (
		<AbsoluteFill>
			<OffthreadVideo
				src={"https://media.hoox.video/Logo%20Hoox%20Animation%20(2).webm"}
				transparent={true}
				style={{
                    position: 'absolute', // Positions the image absolutely
                    top: '40px', // Adds a 10px margin from the top
                    left: '20px', // Adds a 10px margin from the left
                    width: '19%', // Reduces the size to 50% of the original
                    height: 'auto', // Keeps the aspect ratio
                    opacity: 0.85, // Adds transparency
					zIndex: 1000,
                }}
			/>
		</AbsoluteFill>
	);
};