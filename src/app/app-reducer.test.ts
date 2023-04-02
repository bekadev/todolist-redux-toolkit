import {appActions, appReducer, InitialStateType,} from './app-reducer'

let startState: InitialStateType;

beforeEach(() => {
	startState = {
		error: null,
		status: 'idle',
		isInitialized: false
	}
})

test('correct error message should be set', (dispatch: any) => {
	const endState = appReducer(startState, dispatch(appActions.setError({error: 'some error'})))
	expect(endState.error).toBe('some error');
})

test('correct status should be set', (dispatch: any) => {
	const endState = appReducer(startState,  dispatch(appActions.setStatus({status: "loading"})))
	expect(endState.status).toBe('loading');
})

