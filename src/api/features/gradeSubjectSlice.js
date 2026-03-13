import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedGradeId: null,
  selectedGradeNumber: null,
  selectedStreamId: null,
};

const gradeSubjectSlice = createSlice({
  name: "gradeSubject",
  initialState,
  reducers: {
    setSelectedGrade: (state, action) => {
      const { gradeId, gradeNumber } = action.payload || {};
      state.selectedGradeId = gradeId || null;
      state.selectedGradeNumber = gradeNumber ?? null;
      state.selectedStreamId = null;
    },
    setSelectedStream: (state, action) => {
      state.selectedStreamId = action.payload?.streamId || null;
    },
    resetGradeFlow: () => initialState,
  },
});

export const { setSelectedGrade, setSelectedStream, resetGradeFlow } =
  gradeSubjectSlice.actions;

export default gradeSubjectSlice.reducer;