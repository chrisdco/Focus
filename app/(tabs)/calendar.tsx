import { Redirect } from "expo-router";
import React from "react";

/** Merged into the Plan tab (M6.14); kept so old links keep resolving. */
const CalendarRedirect: React.FC = () => {
  return <Redirect href="/plan" />;
};

export default CalendarRedirect;
