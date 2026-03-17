import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  search: "",
};

const classSlice = createSlice({
  name: "classUi",
  initialState,
  reducers: {
    setClassSearch: (state, action) => {
      state.search = action.payload || "";
    },
    resetClassUi: () => initialState,
  },
});

export const { setClassSearch, resetClassUi } = classSlice.actions;
export default classSlice.reducer;