import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  search: "",
};

const liveSlice = createSlice({
  name: "liveUi",
  initialState,
  reducers: {
    setLiveSearch: (state, action) => {
      state.search = action.payload || "";
    },
    resetLiveUi: () => initialState,
  },
});

export const { setLiveSearch, resetLiveUi } = liveSlice.actions;
export default liveSlice.reducer;