import {createAsyncThunk} from "@reduxjs/toolkit";
import {AppDispatch, AppRootStateType} from "app/store";
import {Dispatch} from "redux";

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
    state: AppRootStateType,
    dispatch: AppDispatch
    rejectValue: null
}>()