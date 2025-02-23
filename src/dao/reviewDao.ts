import { executeWithRetry } from "../lib/db";
import ReviewModel from "../models/Review";
import { IReview } from "../types/review";

export const getReviewByVideoId = async (videoId: string, userId: string) => {
    try {
        return await executeWithRetry(async () => {
            const review = await ReviewModel.findOne({
                userId,
                videoId
            });
            return review;
        });
    } catch (error) {
        console.error("Error while getting review: ", error);
        throw error;
    }
};

export const createReview = async (review: IReview) => {
    try {
      return await executeWithRetry(async () => {
        const newReview = await ReviewModel.create({
            userId: review.userId,
            videoId: review.videoId,
            stars: review.stars,
            review: review.review
        });
        return newReview;
      });
    } catch (error) {
      console.error("Error while creating review: ", error);
      throw error;
    }
};

export const updateReview = async (review: Partial<IReview>) => {
    try {
        return await ReviewModel.findOneAndUpdate(
            { videoId: review.videoId},
            review,
            { new: true }
        );
    } catch (error) {
        console.error("Error while updating review: ", error);
        throw error;
    }
};