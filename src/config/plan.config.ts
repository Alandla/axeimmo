import { PlanName } from "../types/enums";
import { Plan } from "../types/plan";

export const discount = {
  active: false,
  mode: "all", // "year" or "month" or "all"
  reduction: 0.8,
  couponId: process.env.NODE_ENV === "development" ? "1prfCTD9": "LFuOJEsa"
}

export const plans: Plan[] = [
  {
    name: PlanName.START,
    icon: "Star",
    monthlyPrice: 20,
    annualPrice: 16,
    credits: 150,
    priceId: {
      month: { 
        euros: process.env.NODE_ENV === "development" ? "price_1R6XrvD0Qr1zHqqnLPT9g4BF" : "price_1R6XvsD0Qr1zHqqnz0NQiI4L",
        dollars: process.env.NODE_ENV === "development" ? "price_1R9xBzD0Qr1zHqqnnQYsJw9Q" : "price_1R9xIZD0Qr1zHqqnmajg3MvG",
      },
      annual: {
        euros: process.env.NODE_ENV === "development" ? "price_1R9xDOD0Qr1zHqqnAN37CWFN" : "price_1R9xJBD0Qr1zHqqnMLECPxNs",
        dollars: process.env.NODE_ENV === "development" ? "price_1R9xDbD0Qr1zHqqnml4AATHb" : "price_1R9xJKD0Qr1zHqqnoyr4zPxw",
      },
    },
    users: 1,
    maxVideoDuration: 1,
  },
  {
    name: PlanName.PRO,
    icon: "Heart",
    monthlyPrice: 50,
    annualPrice: 40,
    credits: 400,
    priceId: {
        month: {
            euros: process.env.NODE_ENV === "development" ? "price_1R5Au9D0Qr1zHqqnwu1SThl7" : "price_1R6Xw0D0Qr1zHqqnkcpYlQTP",
            dollars: process.env.NODE_ENV === "development" ? "price_1R9xEUD0Qr1zHqqnoZmgaZnE" : "price_1R9xKMD0Qr1zHqqnMaVmO7qe",
        },
        annual: {
            euros: process.env.NODE_ENV === "development" ? "price_1R9xEvD0Qr1zHqqnHVEoSqBd" : "price_1R9xKbD0Qr1zHqqns1pjZ4jr",
            dollars: process.env.NODE_ENV === "development" ? "price_1R9xF2D0Qr1zHqqnAw3tBdzg" : "price_1R9xKrD0Qr1zHqqnmL8zmvD2",
        },
    },
    users: 2,
    maxVideoDuration: 3,
    popular: true
  },
  {
    name: PlanName.ENTREPRISE,
    icon: "Gem",
    monthlyPrice: 100,
    annualPrice: 80,
    credits: 800,
    priceId: {
        month: {
            euros: process.env.NODE_ENV === "development" ? "price_1R5AuYD0Qr1zHqqnC0aVFLmN" : "price_1R6XwsD0Qr1zHqqnxSzXWLST",
            dollars: process.env.NODE_ENV === "development" ? "price_1R9xFjD0Qr1zHqqnQ4ZALCYG" : "price_1R9xLPD0Qr1zHqqn0rB635DR",
        },
        annual: {
            euros: process.env.NODE_ENV === "development" ? "price_1R9xG9D0Qr1zHqqnraJ93qd6" : "price_1R9xMrD0Qr1zHqqnLS5SXneL",
            dollars: process.env.NODE_ENV === "development" ? "price_1R9xGMD0Qr1zHqqnLluVzRZU" : "price_1R9xMyD0Qr1zHqqnlADC8BdC",
        },
    },
    users: 5,
    maxVideoDuration: 5,
  }
]