'use script';

const PARENT_HEADING_TAG = 'h2';
const CHILD_HEADING_TAG = 'h3';
const HEADINGS_CSS_QUERY = `${PARENT_HEADING_TAG}, ${CHILD_HEADING_TAG}`;
const NAVBAR_CLASS_NAME = 'table-of-contents';

class Heading {
	constructor(id, textContent) {
		this.id = id;
		this.textContent = textContent;
		this.children = [];
		this._htmlLink = null;
		this._htmlListElement = null;
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
			children.forEach((heading) => {
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

insertFragmentInDOM = (fragment) => {
	const main = document.querySelector('.main');
	const parent = main.parentNode;
	parent.insertBefore(fragment, main);
}

const createNavbarHTML = () => {
	const htmlHeadings = getAllHTMLHeadings();
	const headings = getStructuredHeadings(htmlHeadings);
	const { fragment, htmlList } = getNavbarInitialHTMLWrapper();
	insertHeadingsInList(htmlList, headings);
	insertFragmentInDOM(fragment);
}

document.addEventListener('DOMContentLoaded', createNavbarHTML);
