import { blue, bold, YaksokError } from "./common.ts";
import type { Token } from "../prepare/tokenize/token.ts";

interface InvalidParentClassErrorResource {
  name: string;
}

export class InvalidParentClassError
  extends YaksokError<InvalidParentClassErrorResource> {
  constructor(props: { resource: InvalidParentClassErrorResource }) {
    super(props);
    this.message = `${
      bold(
        blue(props.resource.name),
      )
    }은(는) 부모 클래스로 쓸 수 없습니다.`;
  }
}

interface NotAClassErrorResource {
  className: string;
}

export class NotAClassError extends YaksokError<NotAClassErrorResource> {
  constructor(props: {
    resource: NotAClassErrorResource;
    tokens?: Token[];
  }) {
    super(props);
    this.message = `${
      bold(
        blue(props.resource.className),
      )
    }은(는) 클래스가 아닙니다.`;
  }
}

export class DotAccessOnlyOnInstanceError extends YaksokError {
  constructor(props: { tokens?: Token[] }) {
    super(props);
    this.message = "온점(.)은 인스턴스에만 사용할 수 있습니다.";
  }
}

interface ConstructorArityMismatchErrorResource {
  className: string;
  expected: number[];
  received: number;
}

export class ConstructorArityMismatchError
  extends YaksokError<ConstructorArityMismatchErrorResource> {
  constructor(props: {
    resource: ConstructorArityMismatchErrorResource;
    tokens?: Token[];
  }) {
    super(props);
    const { className, expected, received } = props.resource;
    const expectedStr =
      expected.length === 1
        ? `${expected[0]}개`
        : `${expected.slice(0, -1).join(", ")} 또는 ${expected.at(-1)}개`;
    this.message = `${
      bold(blue(className))
    }의 __준비__에 인자 ${received}개를 넘겼지만, 정의된 생성자는 ${expectedStr} 인자를 받습니다.`;
  }
}
