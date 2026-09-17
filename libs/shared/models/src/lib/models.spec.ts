import { GATE_STATES, TICKET_STATES, nextCommand } from './models';

describe('the state machine', () => {
  it('leaves exactly the two gate states to the human', () => {
    const waiting = TICKET_STATES.filter((s) => nextCommand(s) === null);
    expect(waiting).toEqual(['spec-draft', 'in-review', 'done']);
    // 'done' is finished, the other two are the gates
    expect(Object.keys(GATE_STATES).sort()).toEqual(['in-review', 'spec-draft']);
  });

  it('routes a state that has work left to a command', () => {
    expect(nextCommand('backlog')).toBe('factory-spec');
    expect(nextCommand('spec-approved')).toBe('factory-plan');
    expect(nextCommand('planned')).toBe('factory-implement');
    expect(nextCommand('changes-requested')).toBe('factory-implement');
    expect(nextCommand('merged')).toBe('factory-release');
  });
});
