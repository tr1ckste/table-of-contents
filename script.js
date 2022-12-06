'use script';

const PARENT_HEADING_TAG = 'h2';
const CHILD_HEADING_TAG = 'h3';
const HEADINGS_CSS_QUERY = `${PARENT_HEADING_TAG}, ${CHILD_HEADING_TAG}`;
const NAVBAR_CLASS_NAME = 'table-of-contents';
const TOP_OFFSET = 0;

let globalNavLinks;

class Heading {
	constructor(id, textContent) {
		this.id = id;
		this.textContent = textContent;
		this.children = [];
		this._htmlLink = null;
		this._htmlListElement = null;
		this._parentLink = null;
	}

	addChild(child) {
		this.children.push(child);
	}

	set htmlLink(htmlLink) {
		this._htmlLink = htmlLink;
	}

	get htmlLink() {
		return this._htmlLink;
	}

	set htmlListElement(htmlListElement) {
		this._htmlListElement = htmlListElement;
	}

	get htmlListElement() {
		return this._htmlListElement;
	}

	set parentLink(parentLink) {
		this._parentLink = parentLink;
	}

	get parentLink() {
		return this._parentLink;
	}
}

class NavigationLink {
	constructor (from, to, htmlElement) {
		this.from = from;
		this.to = to;
		this.htmlElement = htmlElement;
	}
}

const getAllHTMLHeadings = () => document.querySelectorAll(HEADINGS_CSS_QUERY);

const getNavbarInitialHTMLWrapper = () => {
	const fragment = document.createDocumentFragment();
	const navbarSection = document.createElement('div');
	navbarSection.classList.add(NAVBAR_CLASS_NAME);
	const htmlList = document.createElement('ul');
	navbarSection.appendChild(htmlList);
	fragment.appendChild(navbarSection);
	return { fragment, navbarSection, htmlList };
}

const getStructuredHeadings = htmlHeadings => {
	const structuredHeadings = [];
	let lastParentHeading = null;
	htmlHeadings.forEach(htmlHeading => {
		const { id, localName, textContent } = htmlHeading;
		const heading = new Heading(id, textContent);
		if (localName === PARENT_HEADING_TAG) {
			lastParentHeading = heading;
			structuredHeadings.push(heading);
		} else {
			lastParentHeading.addChild(heading);
		}
	});
	return structuredHeadings;
}

const getListElements = (id, textContent) => {
	const listElement = document.createElement('li');
	const link = document.createElement('a');
	link.href = `#${id}`;
	link.appendChild(document.createTextNode(textContent));
	listElement.appendChild(link);
	return { link, listElement };
}

const insertHeadingsInList = (htmlList, headings) => {
	headings.forEach((heading) => {
		const { id, textContent, children } = heading;
		const { link, listElement } = getListElements(id, textContent);
		heading.htmlLink = link;
		heading.htmlListElement = listElement;
		if (children.length) {
			const innerList = document.createElement('ul');
			listElement.appendChild(innerList);
			children.forEach((heading, ) => {
				const { id, textContent } = heading;
				const { link, listElement } = getListElements(id, textContent);
				heading.htmlLink = link;
				heading.htmlListElement = listElement;
				innerList.appendChild(listElement);
			});
		}
		htmlList.appendChild(listElement);
	});
}

const insertFragmentInDOM = fragment => {
	const main = document.querySelector('.main');
	const parent = main.parentNode;
	parent.insertBefore(fragment, main);
}

const getOffsetTopById = id => document.getElementById(id).offsetTop;

const addParentNavLink = (heading, headings, parentHasNext, navLinks, index, offsetTop) => {
	const { htmlLink } = heading;
	const navLink = new NavigationLink(offsetTop);
	navLink.htmlElement = htmlLink;
	if (!parentHasNext) {
		navLink.to = +Infinity;
	} else {
		const nextHeadingId = headings[index + 1].id;
		const offsetTop = getOffsetTopById(nextHeadingId);
		navLink.to = offsetTop;
	}
	navLinks.push(navLink);
}

const addChildNavLink = (
	offsetTop,
	navLinks,
	child,
	parentHasNext,
	children,
	headings,
	childrenLastIndex,
	childIndex,
	index
) => {
	const childHasNext = childIndex !== childrenLastIndex;
	const navLink = new NavigationLink(offsetTop);
	navLinks.push(navLink);
	navLink.htmlElement = child.htmlLink;
	navLink.from = getOffsetTopById(child.id);
	const nextChild = childHasNext ? children[childIndex + 1] : null;
	const nextParent = parentHasNext ? headings[index + 1] : null;
	if (nextChild) {
		navLink.to = getOffsetTopById(nextChild.id);
		return;
	}
	if (nextParent) {
		navLink.to = getOffsetTopById(nextParent.id);
		return;
	}
	navLink.to = +Infinity;
}

const getNavLinksList = headings => {
	const navLinks = [];
	const lastHeadingsIndex = headings.length - 1;
	headings.forEach((heading, index, headings) => {
		const parentHasNext = index !== lastHeadingsIndex;
		const offsetTop = getOffsetTopById(heading.id);
		addParentNavLink(heading, headings, parentHasNext, navLinks, index, offsetTop);
		const { children } = heading;
		const childrenLastIndex = children.length;
		children.forEach((child, childIndex, children) => {
			addChildNavLink(
				offsetTop,
				navLinks,
				child,
				parentHasNext,
				children,
				headings,
				childrenLastIndex,
				childIndex,
				index
			);
		});
	});
	return navLinks;
}

const highlightNavLinksOnScroll = () => {
	const { scrollY } = window;
	const scrollWithOffset = scrollY - TOP_OFFSET;
	globalNavLinks.forEach(({ from, to, htmlElement }) => {
		if (scrollWithOffset >= from && scrollWithOffset < to) {
			htmlElement.classList.add('link-active');
			return;
		}
		htmlElement.classList.remove('link-active');
	})
}

const createNavbarHTML = () => {
	const htmlHeadings = getAllHTMLHeadings();
	const headings = getStructuredHeadings(htmlHeadings);
	const { fragment, htmlList } = getNavbarInitialHTMLWrapper();
	insertHeadingsInList(htmlList, headings);
	insertFragmentInDOM(fragment);
	globalNavLinks = getNavLinksList(headings);
	document.addEventListener(
		'scroll',
		highlightNavLinksOnScroll
	);
}

document.addEventListener('DOMContentLoaded', createNavbarHTML);
