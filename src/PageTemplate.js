
/**
 * Describes the overall structure of a main page on the UI.
 */
class PageTemplate {
 
    constructor(pageDescriptor, sideBarText, isEnabledNow) {

        this.pageDescriptor = pageDescriptor;
        this.sideBarText = sideBarText;
        this.isEnabledNow = isEnabledNow;
    }

    SideBarText() {
        return this.sideBarText;
    }
    IsEnabledNow() {
        return this.isEnabledNow;
    }
    PageDescriptor() {
        return this.pageDescriptor;
    }
}
export default PageTemplate;