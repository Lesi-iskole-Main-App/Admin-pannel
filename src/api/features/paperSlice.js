import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  lastCreatedPaper: null,
};

const paperSlice = createSlice({
  name: "paper",
  initialState,
  reducers: {
    setLastCreatedPaper: (state, action) => {
      state.lastCreatedPaper = action.payload || null;
    },
    clearLastCreatedPaper: (state) => {
      state.lastCreatedPaper = null;
    },
  },
});

export const { setLastCreatedPaper, clearLastCreatedPaper } = paperSlice.actions;
export default paperSlice.reducer;