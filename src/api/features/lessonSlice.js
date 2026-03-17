import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  search: "",
};

const lessonSlice = createSlice({
  name: "lessonUi",
  initialState,
  reducers: {
    setLessonSearch: (state, action) => {
      state.search = action.payload || "";
    },
    resetLessonUi: () => initialState,
  },
});

export const { setLessonSearch, resetLessonUi } = lessonSlice.actions;
export default lessonSlice.reducer;

