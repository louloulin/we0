export default class SwitchableStream extends TransformStream {
  private _controller: TransformStreamDefaultController | null = null;
  private _currentReader: ReadableStreamDefaultReader | null = null;
  private _switches = 0;

  constructor() {
    let controllerRef: TransformStreamDefaultController | undefined;

    super({
      start(controller) {
        controllerRef = controller;
      },
    });

    if (controllerRef === undefined) {
      throw new Error('Controller not properly initialized');
    }

    this._controller = controllerRef;
  }

  async switchSource(newStream: ReadableStream) {
    if (this._currentReader) {
      await this._currentReader.cancel();
    }

    this._currentReader = newStream.getReader();

    this._pumpStream();

    this._switches++;
  }

  private async _pumpStream() {
    if (!this._currentReader || !this._controller) {
      console.error('Stream is not properly initialized');
      return;
    }

    try {
      while (true) {
        const { done, value } = await this._currentReader.read();

        if (done) {
          break;
        }

        // 检查控制器是否仍然可用
        if (this._controller) {
          this._controller.enqueue(value);
        } else {
          break;
        }
      }
    } catch (error) {
      console.error('Stream pump error:', error);
      // 只有在控制器仍然可用时才报告错误
      if (this._controller) {
        try {
          this._controller.error(error);
        } catch (controllerError) {
          console.error('Controller error reporting failed:', controllerError);
        }
      }
    }
  }

  close() {
    try {
      if (this._currentReader) {
        this._currentReader.cancel().catch(error => {
          console.error('Error canceling reader:', error);
        });
        this._currentReader = null;
      }

      if (this._controller) {
        this._controller.terminate();
        this._controller = null;
      }
    } catch (error) {
      console.error('Error closing stream:', error);
    }
  }

  get switches() {
    return this._switches;
  }
}
