import { areaLabelFor, navGroupsFor } from './nav-items';

describe('nav-items', () => {
  it('AreaLabelFor_UrlPrefix_ReturnsRoleAreaLabel', () => {
    expect(areaLabelFor('/staff/queue?x=1')).toBe('Officer');
    expect(areaLabelFor('/manager')).toBe('Manager');
    expect(areaLabelFor('/claimant/claims#top')).toBe('Claimant');
    expect(areaLabelFor('/login')).toBe('');
    expect(areaLabelFor('/')).toBe('');
  });

  it('NavGroupsFor_NoRoles_ReturnsNoGroups', () => {
    expect(navGroupsFor([])).toEqual([]);
  });
});
